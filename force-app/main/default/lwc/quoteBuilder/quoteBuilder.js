import { LightningElement, api, wire } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import {
  createRecord,
  getRecord,
  getFieldValue,
  notifyRecordUpdateAvailable,
  updateRecord
} from "lightning/uiRecordApi";

import BIKE_QUOTE_OBJECT from "@salesforce/schema/Bike_Quote__c";
import NAME_FIELD from "@salesforce/schema/Bike_Quote__c.Name";
import ACCOUNT_FIELD from "@salesforce/schema/Bike_Quote__c.Account__c";
import BIKE_QUOTE_CONVERTED_ORDER_FIELD from "@salesforce/schema/Bike_Quote__c.Converted_Order__c";
import STATUS_FIELD from "@salesforce/schema/Bike_Quote__c.Status__c";
import BIKE_QUOTE_TOTAL_FIELD from "@salesforce/schema/Bike_Quote__c.Total_Amount__c";

import BIKE_QUOTE_ITEM_OBJECT from "@salesforce/schema/Bike_Quote_Item__c";
import BIKE_QUOTE_ITEM_QUOTE_FIELD from "@salesforce/schema/Bike_Quote_Item__c.Bike_Quote__c";
import BIKE_QUOTE_ITEM_BIKE_FIELD from "@salesforce/schema/Bike_Quote_Item__c.Bike__c";
import BIKE_QUOTE_ITEM_QTY_FIELD from "@salesforce/schema/Bike_Quote_Item__c.Quantity__c";
import BIKE_QUOTE_ITEM_UNIT_PRICE_FIELD from "@salesforce/schema/Bike_Quote_Item__c.Unit_Price__c";
import convertQuoteToOrder from "@salesforce/apex/BikeOrderService.convertQuoteToOrder";

const QUOTE_FIELDS = [
  ACCOUNT_FIELD,
  BIKE_QUOTE_TOTAL_FIELD,
  STATUS_FIELD,
  BIKE_QUOTE_CONVERTED_ORDER_FIELD
];

// Componente para criar quote rapida a partir da bike selecionada
export default class QuoteBuilder extends LightningElement {
  // Armazena o Id da bike selecionada
  _bikeId;

  // Retorna o Id atual da bike selecionada
  @api
  get bikeId() {
    return this._bikeId;
  }

  // Reage a troca de bike e prepara o preco padrao
  set bikeId(value) {
    const hasChanged = this._bikeId !== value;
    this._bikeId = value;

    // Ao trocar de bike, restaura o preco padrao enquanto nao houver edicao manual
    if (hasChanged) {
      this.hasEditedUnitPrice = false;
      this.unitPrice = this._defaultUnitPrice;
    }
  }

  // Recebe o nome da bike selecionada
  @api bikeName;

  // Indica se a bike selecionada esta sem estoque
  @api isBikeOutOfStock = false;

  // Armazena o preco padrao recebido do componente pai
  _defaultUnitPrice = 0;

  // Retorna o preco padrao atual da bike
  @api
  get defaultUnitPrice() {
    return this._defaultUnitPrice;
  }

  // Mantem o preco unitario sincronizado enquanto o usuario nao editar manualmente
  set defaultUnitPrice(value) {
    this._defaultUnitPrice = value != null ? Number(value) : 0;

    if (!this.hasEditedUnitPrice) {
      this.unitPrice = this._defaultUnitPrice;
    }
  }

  // Guarda a conta selecionada para a quote
  accountId;

  // Guarda o Id da quote em edicao
  quoteId;

  // Guarda os itens adicionados localmente para atualizacao imediata da UI
  quoteItems = [];

  // Guarda o total calculado localmente para exibicao imediata
  localQuoteTotal = 0;

  // Guarda a quantidade informada para o item atual
  quantity = 1;

  // Guarda o preco unitario informado para o item atual
  unitPrice = 0;

  // Indica se o preco unitario foi alterado manualmente
  hasEditedUnitPrice = false;

  // Controla o estado de criacao da quote
  isSavingQuote = false;

  // Controla o estado de adicao de item
  isAddingItem = false;

  // Controla o estado de conversao da quote em pedido
  isConvertingOrder = false;

  // Guarda o Id do pedido criado apos a conversao
  createdOrderId;

  // Carrega os dados atuais da quote para status, total e pedido convertido
  @wire(getRecord, { recordId: "$quoteId", fields: QUOTE_FIELDS })
  wiredQuote;

  // Indica se ja existe uma quote criada no fluxo atual
  get hasQuote() {
    return Boolean(this.quoteId);
  }

  // Define se a criacao da quote esta habilitada
  get canCreateQuote() {
    return (
      Boolean(this.accountId) &&
      !this.hasQuote &&
      !this.isSavingQuote &&
      !this.isBikeOutOfStock
    );
  }

  // Define se a adicao de item esta habilitada
  get canAddItem() {
    return (
      this.hasQuote &&
      Boolean(this.bikeId) &&
      Number(this.quantity) > 0 &&
      Number(this.unitPrice) >= 0 &&
      !this.isAddingItem
    );
  }

  // Permite converter apenas quando existe quote no fluxo atual
  get canConvertToOrder() {
    return this.hasQuote && !this.isConvertingOrder && !this.convertedOrderId;
  }

  // Indica se o botao de criar quote deve ficar desabilitado
  get isCreateQuoteDisabled() {
    return !this.canCreateQuote;
  }

  // Indica se o botao de adicionar item deve ficar desabilitado
  get isAddItemDisabled() {
    return !this.canAddItem;
  }

  // Indica se o botao de converter deve ficar desabilitado
  get isConvertDisabled() {
    return !this.canConvertToOrder;
  }

  // Retorna o total atual priorizando o valor calculado localmente
  get quoteTotal() {
    if (this.quoteItems.length) {
      return this.localQuoteTotal;
    }

    return getFieldValue(this.wiredQuote.data, BIKE_QUOTE_TOTAL_FIELD) || 0;
  }

  // Retorna o status atual da quote carregada
  get quoteStatus() {
    return getFieldValue(this.wiredQuote.data, STATUS_FIELD) || "Draft";
  }

  // Retorna o texto de referencia da quote atual
  get quoteLabel() {
    if (!this.quoteId) return "";
    return `Quote Reference: ${this.quoteId}`;
  }

  // Retorna o Id do pedido criado apos a conversao
  get convertedOrderId() {
    return (
      this.createdOrderId ||
      getFieldValue(this.wiredQuote.data, BIKE_QUOTE_CONVERTED_ORDER_FIELD) ||
      null
    );
  }

  // Retorna o texto de referencia do pedido convertido
  get orderLabel() {
    if (!this.convertedOrderId) return "";
    return `Order Reference: ${this.convertedOrderId}`;
  }

  // Captura a conta selecionada para vincular na quote
  handleAccountChange(event) {
    this.accountId = event.detail.recordId;
  }

  // Atualiza a quantidade do item atual
  handleQuantityChange(event) {
    this.quantity = Number(event.target.value);
  }

  // Atualiza o preco unitario informado no formulario
  handleUnitPriceChange(event) {
    this.hasEditedUnitPrice = true;
    this.unitPrice = Number(event.target.value);
  }

  // Cria uma quote em status Draft para a conta selecionada
  async handleCreateDraftQuote() {
    if (!this.accountId) {
      this.showError("Select an account before creating a quote.");
      return;
    }

    // Bloqueia criação quando bike está indisponível
    if (this.isBikeOutOfStock) {
      this.showError("Cannot create a quote for an out-of-stock bike.");
      return;
    }

    this.isSavingQuote = true;

    try {
      // Monta os campos minimos para criacao da quote
      const fields = {};
      fields[NAME_FIELD.fieldApiName] = `Draft Quote ${Date.now()}`;
      fields[ACCOUNT_FIELD.fieldApiName] = this.accountId;
      fields[STATUS_FIELD.fieldApiName] = "Draft";

      const recordInput = {
        apiName: BIKE_QUOTE_OBJECT.objectApiName,
        fields
      };

      const result = await createRecord(recordInput);
      // Guarda a referencia da quote criada para os proximos itens
      this.quoteId = result.id;
      this.quoteItems = [];
      this.localQuoteTotal = 0;
      // Limpa a referencia anterior de pedido ao iniciar nova quote
      this.createdOrderId = null;

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

  // Adiciona a bike selecionada como item da quote atual
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
      // Normaliza os valores numericos usados na criacao do item
      const quantity = Number(this.quantity);
      const unitPrice = Number(this.unitPrice);
      const itemTotal = quantity * unitPrice;

      // Monta o payload do item com quote, bike, quantidade e preco
      const fields = {};
      fields[BIKE_QUOTE_ITEM_QUOTE_FIELD.fieldApiName] = this.quoteId;
      fields[BIKE_QUOTE_ITEM_BIKE_FIELD.fieldApiName] = this.bikeId;
      fields[BIKE_QUOTE_ITEM_QTY_FIELD.fieldApiName] = quantity;
      fields[BIKE_QUOTE_ITEM_UNIT_PRICE_FIELD.fieldApiName] = unitPrice;

      const recordInput = {
        apiName: BIKE_QUOTE_ITEM_OBJECT.objectApiName,
        fields
      };

      await createRecord(recordInput);

      // Calcula o total local imediatamente apos a criacao do item
      const currentPersistedTotal =
        getFieldValue(this.wiredQuote.data, BIKE_QUOTE_TOTAL_FIELD) || 0;
      const currentDisplayedTotal = this.quoteItems.length
        ? this.localQuoteTotal
        : currentPersistedTotal;
      const updatedQuoteTotal = currentDisplayedTotal + itemTotal;

      // Atualiza a memoria local para forcar a reatividade da interface
      this.quoteItems = [
        ...this.quoteItems,
        { qty: quantity, price: unitPrice }
      ];
      this.localQuoteTotal = updatedQuoteTotal;

      // Persiste o total da quote para manter o valor alinhado no registro pai
      await updateRecord({
        fields: {
          Id: this.quoteId,
          [BIKE_QUOTE_TOTAL_FIELD.fieldApiName]: updatedQuoteTotal
        }
      });

      // Notifica o LDS para recarregar os dados atualizados da quote
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

  // Atualiza a quote para Accepted antes da conversao
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

  // Converte a quote atual em pedido
  async handleConvertToOrder() {
    if (!this.quoteId) {
      this.showError("Create a quote first.");
      return;
    }

    // Evita nova conversao quando ja existe pedido gerado para a quote
    if (this.convertedOrderId) {
      this.showError(
        `This quote was already converted to order ${this.convertedOrderId}.`
      );
      return;
    }

    this.isConvertingOrder = true;

    try {
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

  // Exibe um toast de erro padronizado
  showError(message) {
    this.dispatchEvent(
      new ShowToastEvent({
        title: "Error",
        message,
        variant: "error"
      })
    );
  }

  // Extrai uma mensagem amigavel de erro do Lightning Data Service
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
