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
    sortBy = 'priceAsc'; // ordenação selecionada

    isLoading = true;
    errorMessage;

    // carrega bikes
    @wire(getActiveBikes, { limitSize: 50 })
    wiredBikes({ error, data }) {
        this.isLoading = false;

        if (data) {
            this.bikes = data.map(bike => this.mapBikeData(bike));
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

    // opções de ordenação
    get sortOptions() {
        return [
            { label: 'Price: Low to High', value: 'priceAsc' },
            { label: 'Price: High to Low', value: 'priceDesc' },
            { label: 'Name: A to Z', value: 'nameAsc' }
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

    // ordenação
    handleSortChange(event) {
        this.sortBy = event.detail.value;
        this.applyFilters();
    }

    // aplica busca + filtro + ordenação
    applyFilters() {
        const term = this.searchTerm ? this.searchTerm.toLowerCase().trim() : '';
        const typeFilter = this.selectedType;

        let result = [...this.bikes];

        // busca
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

        // filtro por tipo
        if (typeFilter !== 'all') {
            result = result.filter(bike => bike.Bike_Type__c === typeFilter);
        }

        // ordenação
        result.sort((a, b) => {
            if (this.sortBy === 'priceAsc') {
                return (a.Price__c || 0) - (b.Price__c || 0);
            }

            if (this.sortBy === 'priceDesc') {
                return (b.Price__c || 0) - (a.Price__c || 0);
            }

            if (this.sortBy === 'nameAsc') {
                const nameA = a.Name ? a.Name.toLowerCase() : '';
                const nameB = b.Name ? b.Name.toLowerCase() : '';
                return nameA.localeCompare(nameB);
            }

            return 0;
        });

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
                this.selectedBike = this.mapBikeData(result);
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

    // prepara dados visuais da bike
    mapBikeData(bike) {
        return {
            ...bike,
            Image_URL_c__c: bike.Image_URL_c__c
                ? String(bike.Image_URL_c__c).trim()
                : '',
            statusClass: this.getStatusClass(bike.Status__c),
            cardClass: this.selectedBikeId === bike.Id
                ? 'bike-card selected'
                : 'bike-card'
        };
    }

    // define a classe visual do status
    getStatusClass(status) {
        const normalizedStatus = status ? status.toLowerCase() : '';

        if (normalizedStatus === 'active') {
            return 'status-badge status-active';
        }

        if (normalizedStatus === 'out of stock') {
            return 'status-badge status-out';
        }

        if (normalizedStatus === 'discontinued') {
            return 'status-badge status-discontinued';
        }

        return 'status-badge status-default';
    }

    get hasBikes() {
        return this.filteredBikes && this.filteredBikes.length > 0;
    }
}