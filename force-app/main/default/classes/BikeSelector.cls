/**
 * Classe responsável pelas consultas (SOQL) do objeto Bike__c
 */
public with sharing class BikeSelector {

    /**
     * Retorna bicicletas ativas
     */
    public static List<Bike__c> getActiveBikes(Integer limitSize) {

        // Limita quantidade de registros
        Integer sizeToUse = (limitSize == null || limitSize <= 0)
            ? 50
            : Math.min(limitSize, 200);

        return [
            SELECT Id,
                   Name,
                   SKU__c,
                   Price__c,
                   Bike_Type__c,
                   Status__c
            FROM Bike__c
            WHERE Status__c = 'Active'
            ORDER BY Name
            LIMIT :sizeToUse
        ];
    }

    /**
     * Busca uma bicicleta pelo Id
     */
    public static Bike__c getById(Id bikeId) {

        // Evita consulta desnecessária
        if (bikeId == null) {
            return null;
        }

        List<Bike__c> bikes = [
            SELECT Id,
                   Name,
                   SKU__c,
                   Price__c,
                   Bike_Type__c,
                   Status__c
            FROM Bike__c
            WHERE Id = :bikeId
            LIMIT 1
        ];

        return bikes.isEmpty() ? null : bikes[0];
    }
}