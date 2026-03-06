public with sharing class BikeSelector {

    @AuraEnabled(cacheable=true)
    public static List<Bike__c> getActiveBikes(Integer limitSize) {

        Integer sizeToUse = (limitSize == null || limitSize <= 0)
            ? 50
            : Math.min(limitSize, 200);

        return [
            SELECT Id, Name, SKU__c, Price__c, Bike_Type__c, Status__c, Image_URL_c__c
            FROM Bike__c
            WHERE Status__c = 'Active'
            ORDER BY Name
            LIMIT :sizeToUse
        ];
    }

    @AuraEnabled(cacheable=true)
    public static Bike__c getById(Id bikeId) {
        if (bikeId == null) return null;

        List<Bike__c> bikes = [
            SELECT Id, Name, SKU__c, Price__c, Bike_Type__c, Status__c, Image_URL_c__c
            FROM Bike__c
            WHERE Id = :bikeId
            LIMIT 1
        ];
        return bikes.isEmpty() ? null : bikes[0];
    }
}