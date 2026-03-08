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
                    : '',
                cardClass: this.selectedBikeId === bike.Id ? 'bike-card selected' : 'bike-card'
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
        const bikeId = event.currentTarget.dataset.id;

        // salva o Id selecionado
        this.selectedBikeId = bikeId;

        // atualiza destaque visual
        this.updateBikeCardClasses();

        // carrega detalhe da bike
        this.loadBikeDetails();
    }

    // chama Apex para buscar detalhe
    loadBikeDetails() {
        getBikeById({ bikeId: this.selectedBikeId })
            .then(result => {
                this.selectedBike = result;
            })
            .catch(error => {
                console.error('Erro ao carregar detalhe:', error);
            });
    }

    // fecha painel de detalhe
    handleCloseDetails() {
        this.selectedBikeId = null;
        this.selectedBike = null;

        // remove destaque visual
        this.updateBikeCardClasses();
    }

    // atualiza classe dos cards
    updateBikeCardClasses() {
        this.bikes = this.bikes.map(bike => ({
            ...bike,
            cardClass: this.selectedBikeId === bike.Id ? 'bike-card selected' : 'bike-card'
        }));
    }

    get hasBikes() {
        return this.bikes && this.bikes.length > 0;
    }
}