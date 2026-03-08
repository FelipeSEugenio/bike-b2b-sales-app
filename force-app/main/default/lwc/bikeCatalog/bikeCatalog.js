import { LightningElement, wire } from 'lwc';
import getActiveBikes from '@salesforce/apex/BikeSelector.getActiveBikes';
import getBikeById from '@salesforce/apex/BikeSelector.getById';

export default class BikeCatalog extends LightningElement {

    bikes = []; // lista de bikes
    selectedBikeId = null; // guarda o Id da bike selecionada
    selectedBike = null; // guarda detalhes da bike selecionada

    isLoading = true;
    errorMessage;

    // carrega bikes do catálogo
    @wire(getActiveBikes, { limitSize: 50 })
    wiredBikes({ error, data }) {

        this.isLoading = false;

        if (data) {

            this.bikes = data.map(bike => ({
                ...bike,
                Image_URL_c__c: bike.Image_URL_c__c
                    ? String(bike.Image_URL_c__c).trim()
                    : ''
            }));

            this.errorMessage = undefined;

        } else if (error) {

            this.bikes = [];
            this.errorMessage = 'Erro ao carregar bikes.';
            console.error(error);

        }
    }

    // executa quando o usuário clica em uma bike
    handleBikeClick(event) {

        // pega o Id da bike clicada
        const bikeId = event.currentTarget.dataset.id;

        // salva o Id
        this.selectedBikeId = bikeId;

        console.log('Bike selecionada:', bikeId);

        // busca detalhes da bike
        this.loadBikeDetails();

    }

    // chama o Apex para buscar detalhe da bike
    loadBikeDetails() {

        getBikeById({ bikeId: this.selectedBikeId })
            .then(result => {

                // salva os detalhes da bike
                this.selectedBike = result;

                console.log('Detalhe da bike:', result);

            })
            .catch(error => {

                console.error('Erro ao carregar detalhe:', error);

            });
    }

    get hasBikes() {
        return this.bikes && this.bikes.length > 0;
    }
}