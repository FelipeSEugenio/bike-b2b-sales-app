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
import BIKE_QUOTE_ACCOUNT_FIELD from "@salesforce/schema/Bike_Quote__c.Account__c";
import BIKE_QUOTE_STATUS_FIELD from "@salesforce/schema/Bike_Quote__c.Status__c";
import BIKE_QUOTE_TOTAL_FIELD from "@salesforce/schema/Bike_Quote__c.Total_Amount__c";

import BIKE_QUOTE_ITEM_OBJECT from "@salesforce/schema/Bike_Quote_Item__c";
import BIKE_QUOTE_ITEM_QUOTE_FIELD from "@salesforce/schema/Bike_Quote_Item__c.Bike_Quote__c";
import BIKE_QUOTE_ITEM_BIKE_FIELD from "@salesforce/schema/Bike_Quote_Item__c.Bike__c";
import BIKE_QUOTE_ITEM_QTY_FIELD from "@salesforce/schema/Bike_Quote_Item__c.Quantity__c";
import BIKE_QUOTE_ITEM_UNIT_PRICE_FIELD from "@salesforce/schema/Bike_Quote_Item__c.Unit_Price__c";
import convertQuoteToOrder from "@salesforce/apex/BikeOrderService.convertQuoteToOrder";

const QUOTE_FIELDS = [BIKE_QUOTE_TOTAL_FIELD, BIKE_QUOTE_STATUS_FIELD];

// Componente para criar quote rápida a partir da bike selecionada
export default class QuoteBuilder extends LightningElement {
  _bikeId;
  @api
  get bikeId() {
    return this._bikeId;
  }

  // Reage à troca de bike e prepara preço padrão
  set bikeId(value) {
    const hasChanged = this._bikeId !== value;
    this._bikeId = value;

    // When a new bike is selected, prefill unit price from that bike again.
    if (hasChanged) {
      this.hasEditedUnitPrice = false;
      this.unitPrice = this._defaultUnitPrice;
    }
  }

  @api bikeName;
  @api isBikeOutOfStock = false;

  _defaultUnitPrice = 0;

  @api
  get defaultUnitPrice() {
    return this._defaultUnitPrice;
  }

  // Mantém preço unitário sincronizado enquanto usuário não editar manualmente
  set defaultUnitPrice(value) {
    this._defaultUnitPrice = value != null ? Number(value) : 0;

    if (!this.hasEditedUnitPrice) {
      this.unitPrice = this._defaultUnitPrice;
    }
  }

  accountId;
  quoteId;
  quantity = 1;
  unitPrice = 0;

  hasEditedUnitPrice = false;
  isSavingQuote = false;
  isAddingItem = false;
  isConvertingOrder = false;
  createdOrderId;

  @wire(getRecord, { recordId: "$quoteId", fields: QUOTE_FIELDS })
  wiredQuote;

  // Indica se já existe quote criada no fluxo atual
  get hasQuote() {
    return Boolean(this.quoteId);
  }

  get canCreateQuote() {
    return (
      Boolean(this.accountId) &&
      !this.hasQuote &&
      !this.isSavingQuote &&
      !this.isBikeOutOfStock
    );
  }

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
    return this.hasQuote && !this.isConvertingOrder;
  }

  get isCreateQuoteDisabled() {
    return !this.canCreateQuote;
  }

  get isAddItemDisabled() {
    return !this.canAddItem;
  }

  get isConvertDisabled() {
    return !this.canConvertToOrder;
  }

  get quoteTotal() {
    return getFieldValue(this.wiredQuote.data, BIKE_QUOTE_TOTAL_FIELD) || 0;
  }

  // Retorna status atual da quote carregada
  get quoteStatus() {
    return (
      getFieldValue(this.wiredQuote.data, BIKE_QUOTE_STATUS_FIELD) || "Draft"
    );
  }

  get quoteLabel() {
    if (!this.quoteId) return "";
    return `Quote Reference: ${this.quoteId}`;
  }

  // Exibe referência do pedido criado após conversão
  get orderLabel() {
    if (!this.createdOrderId) return "";
    return `Order Reference: ${this.createdOrderId}`;
  }

  // Captura conta selecionada para vincular na quote
  handleAccountChange(event) {
    this.accountId = event.detail.recordId;
  }

  // Atualiza quantidade do item da quote
  handleQuantityChange(event) {
    this.quantity = Number(event.target.value);
  }

  // Atualiza preço unitário informado no formulário
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
      // Monta campos mínimos para criação da quote
      const fields = {};
      fields.Name = `Draft Quote ${Date.now()}`;
      fields[BIKE_QUOTE_ACCOUNT_FIELD.fieldApiName] = this.accountId;
      fields[BIKE_QUOTE_STATUS_FIELD.fieldApiName] = "Draft";

      const recordInput = {
        apiName: BIKE_QUOTE_OBJECT.objectApiName,
        fields
      };

      const result = await createRecord(recordInput);
      // Guarda referência da quote criada para próximos itens
      this.quoteId = result.id;

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
      // Monta payload do item com quote, bike, quantidade e preço
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
      // Força atualização do total exibido após inserir item
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

  // Atualiza quote para Accepted antes da conversão
  async ensureQuoteAccepted() {
    if (!this.quoteId) return;

    if (this.quoteStatus === "Accepted") {
      return;
    }

    const fields = {
      Id: this.quoteId,
      [BIKE_QUOTE_STATUS_FIELD.fieldApiName]: "Accepted"
    };

    await updateRecord({ fields });
    await notifyRecordUpdateAvailable([{ recordId: this.quoteId }]);
  }

  // Converte quote atual em pedido
  async handleConvertToOrder() {
    if (!this.quoteId) {
      this.showError("Create a quote first.");
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

  // Exibe toast de erro padronizado
  showError(message) {
    this.dispatchEvent(
      new ShowToastEvent({
        title: "Error",
        message,
        variant: "error"
      })
    );
  }

  // Extrai mensagem amigável de erro do Lightning Data Service
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
