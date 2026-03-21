import { LightningElement, api, wire } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import {
  createRecord,
  getRecord,
  getFieldValue,
  notifyRecordUpdateAvailable,
  updateRecord
} from "lightning/uiRecordApi";

// Importa o objeto e campos da Quote
import BIKE_QUOTE_OBJECT from "@salesforce/schema/Bike_Quote__c";
import NAME_FIELD from "@salesforce/schema/Bike_Quote__c.Name";
import ACCOUNT_FIELD from "@salesforce/schema/Bike_Quote__c.Account__c";
import BIKE_QUOTE_CONVERTED_ORDER_FIELD from "@salesforce/schema/Bike_Quote__c.Converted_Order__c";
import STATUS_FIELD from "@salesforce/schema/Bike_Quote__c.Status__c";
import BIKE_QUOTE_TOTAL_FIELD from "@salesforce/schema/Bike_Quote__c.Total_Amount__c";

// Importa o objeto e campos dos Itens da Quote
import BIKE_QUOTE_ITEM_OBJECT from "@salesforce/schema/Bike_Quote_Item__c";
import BIKE_QUOTE_ITEM_QUOTE_FIELD from "@salesforce/schema/Bike_Quote_Item__c.Bike_Quote__c";
import BIKE_QUOTE_ITEM_BIKE_FIELD from "@salesforce/schema/Bike_Quote_Item__c.Bike__c";
import BIKE_QUOTE_ITEM_QTY_FIELD from "@salesforce/schema/Bike_Quote_Item__c.Quantity__c";
import BIKE_QUOTE_ITEM_UNIT_PRICE_FIELD from "@salesforce/schema/Bike_Quote_Item__c.Unit_Price__c";

// Importa o método Apex de conversão de Quote em Order
import convertQuoteToOrder from "@salesforce/apex/BikeOrderService.convertQuoteToOrder";

// Importa o método Apex que busca o total direto do banco após o trigger calcular
import getQuoteTotal from "@salesforce/apex/BikeQuoteController.getQuoteTotal";

// Campos da Quote carregados pelo @wire
const QUOTE_FIELDS = [
  ACCOUNT_FIELD,
  BIKE_QUOTE_TOTAL_FIELD,
  STATUS_FIELD,
  BIKE_QUOTE_CONVERTED_ORDER_FIELD
];

export default class QuoteBuilder extends LightningElement {
  _bikeId;

  // Recebe o ID da bike selecionada no catálogo
  @api
  get bikeId() {
    return this._bikeId;
  }

  // Reage à troca de bike e reseta o preço unitário para o valor padrão
  set bikeId(value) {
    const hasChanged = this._bikeId !== value;
    this._bikeId = value;

    if (hasChanged) {
      this.hasEditedUnitPrice = false;
      this.unitPrice = this._defaultUnitPrice;
    }
  }

  // Nome da bike selecionada — usado nas mensagens de feedback
  @api bikeName;

  // Indica se a bike está sem estoque — bloqueia criação de quote
  @api isBikeOutOfStock = false;

  _defaultUnitPrice = 0;

  // Recebe o preço padrão da bike vindo do componente pai
  @api
  get defaultUnitPrice() {
    return this._defaultUnitPrice;
  }

  // Atualiza o preço unitário exibido enquanto o usuário não editar manualmente
  set defaultUnitPrice(value) {
    this._defaultUnitPrice = value != null ? Number(value) : 0;

    if (!this.hasEditedUnitPrice) {
      this.unitPrice = this._defaultUnitPrice;
    }
  }

  // Propriedades internas do formulário
  accountId; // ID da conta cliente selecionada
  quoteId; // ID da quote criada no fluxo atual
  quantity = 1; // Quantidade do item a adicionar
  unitPrice = 0; // Preço unitário do item

  // Flags de controle de estado do componente
  hasEditedUnitPrice = false; // True quando o usuário editou o preço manualmente
  isSavingQuote = false; // True enquanto a quote está sendo criada
  isAddingItem = false; // True enquanto um item está sendo adicionado
  isConvertingOrder = false; // True enquanto a conversão está em andamento
  createdOrderId; // ID do pedido gerado após a conversão

  // Array local para cálculo imediato do total na tela
  quoteItems = [];

  // Total buscado diretamente do banco após o trigger calcular
  serverQuoteTotal = 0;

  // Carrega os dados da quote atual via LDS sempre que quoteId mudar
  @wire(getRecord, { recordId: "$quoteId", fields: QUOTE_FIELDS })
  wiredQuote;

  // Retorna true se já existe uma quote criada no fluxo atual
  get hasQuote() {
    return Boolean(this.quoteId);
  }

  // Verifica se todas as condições para criar uma quote estão satisfeitas
  get canCreateQuote() {
    return (
      Boolean(this.accountId) &&
      !this.hasQuote &&
      !this.isSavingQuote &&
      !this.isBikeOutOfStock
    );
  }

  // Verifica se todas as condições para adicionar um item estão satisfeitas
  get canAddItem() {
    return (
      this.hasQuote &&
      Boolean(this.bikeId) &&
      Number(this.quantity) > 0 &&
      Number(this.unitPrice) >= 0 &&
      !this.isAddingItem
    );
  }

  // Verifica se a quote pode ser convertida em pedido
  get canConvertToOrder() {
    return this.hasQuote && !this.isConvertingOrder && !this.convertedOrderId;
  }

  // Controla o estado desabilitado do botão de criar quote
  get isCreateQuoteDisabled() {
    return !this.canCreateQuote;
  }

  // Controla o estado desabilitado do botão de adicionar item
  get isAddItemDisabled() {
    return !this.canAddItem;
  }

  // Controla o estado desabilitado do botão de converter em order
  get isConvertDisabled() {
    return !this.canConvertToOrder;
  }

  // Retorna o total mais atualizado disponível
  // Prioridade: total do servidor (pós-trigger) > total local > total do @wire
  get quoteTotal() {
    // Total buscado via Apex após o trigger calcular — mais confiável
    if (this.serverQuoteTotal > 0) return this.serverQuoteTotal;

    // Total calculado localmente enquanto aguarda resposta do servidor
    const localTotal = this.quoteItems.reduce(
      (sum, item) => sum + item.qty * item.price,
      0
    );
    if (localTotal > 0) return localTotal;

    // Fallback para o valor do @wire caso nenhum dos anteriores esteja disponível
    return getFieldValue(this.wiredQuote.data, BIKE_QUOTE_TOTAL_FIELD) || 0;
  }

  // Retorna o status atual da quote carregada via @wire
  get quoteStatus() {
    return getFieldValue(this.wiredQuote.data, STATUS_FIELD) || "Draft";
  }

  // Monta o label de referência da quote para exibição na tela
  get quoteLabel() {
    if (!this.quoteId) return "";
    return `Quote Reference: ${this.quoteId}`;
  }

  // Retorna o ID do pedido — prioriza valor local, depois o do banco
  get convertedOrderId() {
    return (
      this.createdOrderId ||
      getFieldValue(this.wiredQuote.data, BIKE_QUOTE_CONVERTED_ORDER_FIELD) ||
      null
    );
  }

  // Monta o label de referência do pedido para exibição na tela
  get orderLabel() {
    if (!this.convertedOrderId) return "";
    return `Order Reference: ${this.convertedOrderId}`;
  }

  // Captura o ID da conta selecionada no campo de busca
  handleAccountChange(event) {
    this.accountId = event.detail.recordId;
  }

  // Atualiza a quantidade informada pelo usuário no formulário
  handleQuantityChange(event) {
    this.quantity = Number(event.target.value);
  }

  // Atualiza o preço unitário e marca que o usuário fez uma edição manual
  handleUnitPriceChange(event) {
    this.hasEditedUnitPrice = true;
    this.unitPrice = Number(event.target.value);
  }

  // Cria uma nova quote em status Draft vinculada à conta selecionada
  async handleCreateDraftQuote() {
    if (!this.accountId) {
      this.showError("Select an account before creating a quote.");
      return;
    }

    if (this.isBikeOutOfStock) {
      this.showError("Cannot create a quote for an out-of-stock bike.");
      return;
    }

    this.isSavingQuote = true;

    try {
      const fields = {};
      fields[NAME_FIELD.fieldApiName] = `Draft Quote ${Date.now()}`;
      fields[ACCOUNT_FIELD.fieldApiName] = this.accountId;
      fields[STATUS_FIELD.fieldApiName] = "Draft";

      const recordInput = {
        apiName: BIKE_QUOTE_OBJECT.objectApiName,
        fields
      };

      const result = await createRecord(recordInput);
      this.quoteId = result.id;
      this.createdOrderId = null;

      // Reseta o estado local ao iniciar uma nova quote
      this.quoteItems = [];
      this.serverQuoteTotal = 0;

      this.dispatchEvent(
        new ShowToastEvent({
          title: "Draft Quote Created",
          message: "You can now add bikes to this quote.",
          variant: "success"
        })
      );
    } catch (error) {
      this.showError(this.getErrorMessage(error));
    } finally {
      this.isSavingQuote = false;
    }
  }

  // Adiciona a bike selecionada como um item da quote atual
  async handleAddSelectedBike() {
    if (!this.quoteId) {
      this.showError("Create a quote first.");
      return;
    }

    if (!this.bikeId) {
      this.showError("Select a bike from the catalog first.");
      return;
    }

    this.isAddingItem = true;

    try {
      // Monta o payload do item com quote, bike, quantidade e preço
      const fields = {};
      fields[BIKE_QUOTE_ITEM_QUOTE_FIELD.fieldApiName] = this.quoteId;
      fields[BIKE_QUOTE_ITEM_BIKE_FIELD.fieldApiName] = this.bikeId;
      fields[BIKE_QUOTE_ITEM_QTY_FIELD.fieldApiName] = Number(this.quantity);
      fields[BIKE_QUOTE_ITEM_UNIT_PRICE_FIELD.fieldApiName] = Number(
        this.unitPrice
      );

      const recordInput = {
        apiName: BIKE_QUOTE_ITEM_OBJECT.objectApiName,
        fields
      };

      await createRecord(recordInput);

      // Adiciona ao array local para feedback imediato na tela
      this.quoteItems = [
        ...this.quoteItems,
        { qty: Number(this.quantity), price: Number(this.unitPrice) }
      ];

      // Busca o total real do banco — o trigger já calculou o valor correto
      this.serverQuoteTotal = await getQuoteTotal({ quoteId: this.quoteId });

      // Notifica o LDS que o registro pai foi alterado
      await notifyRecordUpdateAvailable([{ recordId: this.quoteId }]);

      this.dispatchEvent(
        new ShowToastEvent({
          title: "Bike Added to Quote",
          message: `${this.bikeName || "Bike"} was added to the draft quote.`,
          variant: "success"
        })
      );
    } catch (error) {
      this.showError(this.getErrorMessage(error));
    } finally {
      this.isAddingItem = false;
    }
  }

  // Atualiza o status da quote para Accepted antes de iniciar a conversão
  async ensureQuoteAccepted() {
    if (!this.quoteId) return;

    if (this.quoteStatus === "Accepted") {
      return;
    }

    const fields = {
      Id: this.quoteId,
      [STATUS_FIELD.fieldApiName]: "Accepted"
    };

    await updateRecord({ fields });
    await notifyRecordUpdateAvailable([{ recordId: this.quoteId }]);
  }

  // Converte a quote atual em um pedido via método Apex
  async handleConvertToOrder() {
    if (!this.quoteId) {
      this.showError("Create a quote first.");
      return;
    }

    // Impede conversão duplicada se a quote já foi convertida anteriormente
    if (this.convertedOrderId) {
      this.showError(
        `This quote was already converted to order ${this.convertedOrderId}.`
      );
      return;
    }

    this.isConvertingOrder = true;

    try {
      // Garante que a quote está Accepted antes de converter
      await this.ensureQuoteAccepted();

      const orderId = await convertQuoteToOrder({ quoteId: this.quoteId });
      this.createdOrderId = orderId;

      this.dispatchEvent(
        new ShowToastEvent({
          title: "Quote Converted",
          message: `Order ${orderId} created successfully.`,
          variant: "success"
        })
      );
    } catch (error) {
      this.showError(this.getErrorMessage(error));
    } finally {
      this.isConvertingOrder = false;
    }
  }

  // Exibe um toast de erro padronizado na tela
  showError(message) {
    this.dispatchEvent(
      new ShowToastEvent({
        title: "Error",
        message,
        variant: "error"
      })
    );
  }

  // Extrai a mensagem de erro do objeto retornado pelo LDS ou pelo Apex
  getErrorMessage(error) {
    if (error?.body?.message) {
      return error.body.message;
    }

    if (error?.message) {
      return error.message;
    }

    return "An unexpected error occurred.";
  }
}
