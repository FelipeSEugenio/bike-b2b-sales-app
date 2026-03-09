import { LightningElement, wire } from 'lwc';
import getActiveBikes from '@salesforce/apex/BikeSelector.getActiveBikes';
import getBikeById from '@salesforce/apex/BikeSelector.getById';

export default class BikeCatalog extends LightningElement {
    bikes = []; // lista original
    filteredBikes = []; // lista exibida
    selectedBikeId = null; // id selecionado
    selectedBike = null; // detalhe selecionado

    searchTerm = ''; // texto da busca
    selectedType = 'all'; // tipo selecionado

    isLoading = true;
    errorMessage;

    // carrega bikes
    @wire(getActiveBikes, { limitSize: 50 })
    wiredBikes({ error, data }) {
        this.isLoading = false;

        if (data) {
            this.bikes = data.map(bike => ({
                ...bike,
                Image_URL_c__c: bike.Image_URL_c__c
                    ? String(bike.Image_URL_c__c).trim()
                    : '',
                cardClass: this.selectedBikeId === bike.Id
                    ? 'bike-card selected'
                    : 'bike-card'
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

    // opções do filtro de tipo
    get typeOptions() {
        const uniqueTypes = [
            ...new Set(
                this.bikes
                    .map(bike => bike.Bike_Type__c)
                    .filter(type => type)
            )
        ].sort();

        const options = uniqueTypes.map(type => ({
            label: type,
            value: type
        }));

        return [
            { label: 'All Types', value: 'all' },
            ...options
        ];
    }

    // busca
    handleSearchChange(event) {
        this.searchTerm = event.target.value;
        this.applyFilters();
    }

    // filtro por tipo
    handleTypeChange(event) {
        this.selectedType = event.detail.value;
        this.applyFilters();
    }

    // aplica busca + filtro
    applyFilters() {
        const term = this.searchTerm ? this.searchTerm.toLowerCase().trim() : '';
        const typeFilter = this.selectedType;

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

        if (typeFilter !== 'all') {
            result = result.filter(bike => bike.Bike_Type__c === typeFilter);
        }

        this.filteredBikes = result.map(bike => ({
            ...bike,
            cardClass: this.selectedBikeId === bike.Id
                ? 'bike-card selected'
                : 'bike-card'
        }));
    }

    // clique no card
    handleBikeClick(event) {
        const bikeId = event.currentTarget.dataset.id;

        this.selectedBikeId = bikeId;
        this.updateBikeCardClasses();
        this.loadBikeDetails();
    }

    // carrega detalhe
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

    // fecha detalhe
    handleCloseDetails() {
        this.selectedBikeId = null;
        this.selectedBike = null;
        this.updateBikeCardClasses();
    }

    // atualiza destaque visual
    updateBikeCardClasses() {
        this.bikes = this.bikes.map(bike => ({
            ...bike,
            cardClass: this.selectedBikeId === bike.Id
                ? 'bike-card selected'
                : 'bike-card'
        }));

        this.filteredBikes = this.filteredBikes.map(bike => ({
            ...bike,
            cardClass: this.selectedBikeId === bike.Id
                ? 'bike-card selected'
                : 'bike-card'
        }));
    }

    get hasBikes() {
        return this.filteredBikes && this.filteredBikes.length > 0;
    }
}