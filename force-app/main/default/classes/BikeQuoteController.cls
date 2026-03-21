// Controller Apex exposto ao LWC para operações da Quote
public with sharing class BikeQuoteController {
  // Retorna o total atualizado da quote diretamente do banco
  // Necessário porque o LDS não invalida campos atualizados por trigger
  @AuraEnabled
  public static Decimal getQuoteTotal(Id quoteId) {
    Bike_Quote__c quote = [
      SELECT Total_Amount__c
      FROM Bike_Quote__c
      WHERE Id = :quoteId
      LIMIT 1
    ];
    return quote.Total_Amount__c != null ? quote.Total_Amount__c : 0;
  }
}
