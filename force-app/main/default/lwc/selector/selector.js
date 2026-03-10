import { LightningElement, wire } from "lwc";
import { getRecord, getFieldValue } from "lightning/uiRecordApi";
import Id from "@salesforce/user/Id";
import NAME_FIELD from "@salesforce/schema/User.Name";
const fields = [NAME_FIELD];

// Componente de composição do catálogo legado (lista + detalhe)
export default class Selector extends LightningElement {
  selectedProductId;

  // Recebe produto selecionado do componente de lista
  handleProductSelected(evt) {
    this.selectedProductId = evt.detail;
  }

  // Identificador do usuário logado
  userId = Id;

  // Busca dados básicos do usuário para cabeçalho da tela
  @wire(getRecord, { recordId: "$userId", fields })
  user;

  // Retorna apenas o nome para exibição
  get name() {
    return getFieldValue(this.user.data, NAME_FIELD);
  }
}
