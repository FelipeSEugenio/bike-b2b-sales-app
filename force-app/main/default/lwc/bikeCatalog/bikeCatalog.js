import { LightningElement, wire } from 'lwc';
import getActiveBikes from '@salesforce/apex/BikeSelector.getActiveBikes';
import getBikeById from '@salesforce/apex/BikeSelector.getById';

export default class BikeCatalog extends LightningElement {
    bikes = []; // lista original
    filteredBikes = []; // lista exibida
    selectedBikeId = null; // guarda o Id da bike selecionada
    selectedBike = null; // guarda detalhes da bike selecionada

    searchTerm = ''; // texto da busca

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

            this.applyFilters();
            this.errorMessage = undefined;
        } else if (error) {
            this.bikes = [];
            this.filteredBikes = [];
            this.errorMessage = 'Erro ao carregar bikes.';
            console.error(error);
        }
    }

    // executa quando o usuário digita na busca
    handleSearchChange(event) {
        this.searchTerm = event.target.value;
        this.applyFilters();
    }

    // aplica filtro de busca
    applyFilters() {
        const term = this.searchTerm ? this.searchTerm.toLowerCase().trim() : '';

        let result = [...this.bikes];

        if (term) {
            result = result.filter(bike => {
                const name = bike.Name ? bike.Name.toLowerCase() : '';
                const type = bike.Bike_Type__c ? bike.Bike_Type__c.toLowerCase() : '';
                const sku = bike.SKU__c ? bike.SKU__c.toLowerCase() : '';

                return (
                    name.includes(term) ||
                    type.includes(term) ||
                    sku.includes(term)
                );
            });
        }

        this.filteredBikes = result.map(bike => ({
            ...bike,
            cardClass: this.selectedBikeId === bike.Id ? 'bike-card selected' : 'bike-card'
        }));
    }

    // executa quando o usuário clica em uma bike
    handleBikeClick(event) {
        const bikeId = event.currentTarget.dataset.id;

        this.selectedBikeId = bikeId;
        this.updateBikeCardClasses();
        this.loadBikeDetails();
    }

    // chama Apex para buscar detalhe
    loadBikeDetails() {
        this.isLoading = true;

        getBikeById({ bikeId: this.selectedBikeId })
            .then(result => {
                this.selectedBike = {
                    ...result,
                    Image_URL_c__c: result.Image_URL_c__c
                        ? String(result.Image_URL_c__c).trim()
                        : ''
                };

                this.errorMessage = undefined;
            })
            .catch(error => {
                this.selectedBike = null;
                this.errorMessage = 'Erro ao carregar detalhe da bike.';
                console.error('Erro ao carregar detalhe:', error);
            })
            .finally(() => {
                this.isLoading = false;
            });
    }

    // fecha painel de detalhe
    handleCloseDetails() {
        this.selectedBikeId = null;
        this.selectedBike = null;
        this.updateBikeCardClasses();
    }

    // atualiza classe dos cards
    updateBikeCardClasses() {
        this.bikes = this.bikes.map(bike => ({
            ...bike,
            cardClass: this.selectedBikeId === bike.Id ? 'bike-card selected' : 'bike-card'
        }));

        this.filteredBikes = this.filteredBikes.map(bike => ({
            ...bike,
            cardClass: this.selectedBikeId === bike.Id ? 'bike-card selected' : 'bike-card'
        }));
    }

    get hasBikes() {
        return this.filteredBikes && this.filteredBikes.length > 0;
    }
}