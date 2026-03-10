import { LightningElement, api, wire } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import {
  createRecord,
  getRecord,
  getFieldValue,
  notifyRecordUpdateAvailable
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

const QUOTE_FIELDS = [BIKE_QUOTE_TOTAL_FIELD];

export default class QuoteBuilder extends LightningElement {
  @api bikeId;
  @api bikeName;

  _defaultUnitPrice = 0;

  @api
  get defaultUnitPrice() {
    return this._defaultUnitPrice;
  }

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

  @wire(getRecord, { recordId: "$quoteId", fields: QUOTE_FIELDS })
  wiredQuote;

  get hasQuote() {
    return Boolean(this.quoteId);
  }

  get canCreateQuote() {
    return Boolean(this.accountId) && !this.hasQuote && !this.isSavingQuote;
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

  get isCreateQuoteDisabled() {
    return !this.canCreateQuote;
  }

  get isAddItemDisabled() {
    return !this.canAddItem;
  }

  get quoteTotal() {
    return getFieldValue(this.wiredQuote.data, BIKE_QUOTE_TOTAL_FIELD) || 0;
  }

  get quoteLabel() {
    if (!this.quoteId) return "";
    return `Quote ${this.quoteId}`;
  }

  handleAccountChange(event) {
    this.accountId = event.detail.recordId;
  }

  handleQuantityChange(event) {
    this.quantity = Number(event.target.value);
  }

  handleUnitPriceChange(event) {
    this.hasEditedUnitPrice = true;
    this.unitPrice = Number(event.target.value);
  }

  async handleCreateDraftQuote() {
    if (!this.accountId) {
      this.showError("Select an account before creating a quote.");
      return;
    }

    this.isSavingQuote = true;

    try {
      const fields = {};
      fields.Name = `Draft Quote ${Date.now()}`;
      fields[BIKE_QUOTE_ACCOUNT_FIELD.fieldApiName] = this.accountId;
      fields[BIKE_QUOTE_STATUS_FIELD.fieldApiName] = "Draft";

      const recordInput = {
        apiName: BIKE_QUOTE_OBJECT.objectApiName,
        fields
      };

      const result = await createRecord(recordInput);
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

  showError(message) {
    this.dispatchEvent(
      new ShowToastEvent({
        title: "Error",
        message,
        variant: "error"
      })
    );
  }

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
