import { LightningElement, wire } from 'lwc';
import getActiveBikes from '@salesforce/apex/BikeSelector.getActiveBikes';

export default class BikeCatalog extends LightningElement {

    bikes;

    @wire(getActiveBikes, { limitSize: 50 })
    wiredBikes({ error, data }) {

        if (data) {
            this.bikes = data;
        }

        if (error) {
            console.error(error);
        }
    }
}