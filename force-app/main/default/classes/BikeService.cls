// Regras de negócio do catálogo de bikes
 
public with sharing class BikeService {

    // Lista bikes ativas (usa o selector)
    
    public static List<Bike__c> listActiveBikes(Integer limitSize) {
        return BikeSelector.getActiveBikes(limitSize);
    }

    //  Valida dados básicos antes de salvar
     
    public static void validateBikes(List<Bike__c> bikes) {
        if (bikes == null || bikes.isEmpty()) return;

        for (Bike__c b : bikes) {
            if (String.isBlank(b.SKU__c)) {
                b.addError('SKU é obrigatório.');
            }
            if (b.Price__c == null || b.Price__c <= 0) {
                b.addError('Price deve ser maior que zero.');
            }
            if (String.isBlank(b.Status__c)) {
                b.addError('Status é obrigatório.');
            }
        }
    }
}