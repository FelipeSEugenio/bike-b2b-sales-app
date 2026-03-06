import { LightningElement, wire } from 'lwc';
import getActiveBikes from '@salesforce/apex/BikeSelector.getActiveBikes';

export default class BikeCatalog extends LightningElement {
    bikes = [];

    @wire(getActiveBikes, { limitSize: 50 })
    wiredBikes({ error, data }) {
        if (data) {
            this.bikes = data.map(bike => ({
                ...bike,
                imageUrl: bike.Image_URL__c ? String(bike.Image_URL__c).trim() : ''
            }));
            console.log(JSON.stringify(this.bikes));
        } else if (error) {
            console.error(error);
        }
    }

    get hasBikes() {
        return this.bikes && this.bikes.length > 0;
    }
}