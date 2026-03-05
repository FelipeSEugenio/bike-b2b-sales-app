import { LightningElement, wire } from 'lwc';
import getActiveBikes from '@salesforce/apex/BikeSelector.getActiveBikes';

export default class BikeCatalog extends LightningElement {
    bikes = [];
    errorMessage;
    isLoading = true;

    @wire(getActiveBikes, { limitSize: 50 })
    wiredBikes({ error, data }) {
        this.isLoading = false;

        if (data) {
            this.bikes = data;
            this.errorMessage = undefined;
        } else if (error) {
            this.bikes = [];
            this.errorMessage = error?.body?.message || 'Erro ao carregar bikes.';
            // log para debug
            // eslint-disable-next-line no-console
            console.error(error);
        }
    }
    get hasBikes() {
        return this.bikes && this.bikes.length > 0;
    }
}