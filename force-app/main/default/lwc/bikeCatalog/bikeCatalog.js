import { LightningElement, wire } from 'lwc';
import getActiveBikes from '@salesforce/apex/BikeSelector.getActiveBikes';

export default class BikeCatalog extends LightningElement {
    bikes = [];
    isLoading = true;
    errorMessage;

    @wire(getActiveBikes, { limitSize: 50 })
    wiredBikes({ error, data }) {
        this.isLoading = false;

        if (data) {
            this.bikes = data.map(bike => ({
                ...bike,
                Image_URL_c__c: bike.Image_URL_c__c ? String(bike.Image_URL_c__c).trim() : ''
            }));
            this.errorMessage = undefined;
            console.log('Bikes carregadas:', JSON.stringify(this.bikes));
        } else if (error) {
            this.bikes = [];
            this.errorMessage = 'Erro ao carregar bikes.';
            console.error('Erro no wire:', error);
        }
    }

    handleBikeClick(event) {
        const bikeId = event.currentTarget.dataset.id;
        console.log('Bike selecionada:', bikeId);
    }

    get hasBikes() {
        return this.bikes && this.bikes.length > 0;
    }
}