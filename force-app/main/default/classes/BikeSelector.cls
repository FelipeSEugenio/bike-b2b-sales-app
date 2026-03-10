public with sharing class BikeSelector {
  // Retorna bikes ativas para o catálogo
  @AuraEnabled(cacheable=true)
  public static List<Bike__c> getActiveBikes(Integer limitSize) {
    // Define limite padrão e evita valores muito altos
    Integer sizeToUse = (limitSize == null ||
      limitSize <= 0)
      ? 50
      : Math.min(limitSize, 200);

    return [
      SELECT
        Id,
        Name,
        SKU__c,
        Price__c,
        Bike_Type__c,
        Status__c,
        Image_URL_c__c,
        Stock_Quantity__c,
        Stock_Status__c
      FROM Bike__c
      WHERE Status__c = 'Active'
      ORDER BY Name
      LIMIT :sizeToUse
    ];
  }

  // Busca uma bike pelo Id
  @AuraEnabled(cacheable=true)
  public static Bike__c getById(Id bikeId) {
    if (bikeId == null)
      return null;

    List<Bike__c> bikes = [
      SELECT
        Id,
        Name,
        SKU__c,
        Price__c,
        Bike_Type__c,
        Status__c,
        Image_URL_c__c,
        Stock_Quantity__c,
        Stock_Status__c
      FROM Bike__c
      WHERE Id = :bikeId
      LIMIT 1
    ];

    return bikes.isEmpty() ? null : bikes[0];
  }
}
