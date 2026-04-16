import type { Knex } from 'knex';

export interface SapCustomerRow {
  cardCode: string;
  cardName: string;
  phone1: string | null;
  emailAddress: string | null;
  creditLimit: number;
  currentAccountBalance: number;
  frozen: string;
  salesPersonCode: number;
  addresses: Array<{
    AddressType: string;
    AddressName: string;
    Street: string | null;
    City: string | null;
    State: string | null;
    ZipCode: string | null;
    Country: string | null;
  }>;
}

export interface SapItemRow {
  itemCode: string;
  itemName: string;
  foreignName: string | null;
  userText: string | null;
  salesUnit: string;
  strengthPsi: number | null;
  valid: string;
  frozen: string;
}

export interface SapOrderRow {
  docEntry: number;
  docNum: number;
  cardCode: string;
  cardName: string;
  docDate: string;
  docDueDate: string;
  docTotal: number;
  docCurrency: string;
  documentStatus: string;
  cancelled: string;
  comments: string | null;
  salesPersonCode: number;
  lines: Array<{
    LineNum: number;
    ItemCode: string;
    Quantity: number;
    Price: number;
    Currency: string;
    WarehouseCode: string | null;
    LineTotal: number;
    ShipDate: string | null;
    UoMCode: string | null;
  }>;
}

export interface SapWarehouseRow {
  warehouseCode: string;
  warehouseName: string;
  inactive: string;
}

export class SapMirrorRepository {
  constructor(
    private sapDb: Knex,
    private companyDb: string,
  ) {}

  async getCustomers(sinceDate?: Date): Promise<SapCustomerRow[]> {
    let qb = this.sapDb('sap_master_data')
      .select(
        this.sapDb.raw(`"Data"->>'CardCode' AS "cardCode"`),
        this.sapDb.raw(`"Data"->>'CardName' AS "cardName"`),
        this.sapDb.raw(`"Data"->>'Phone1' AS "phone1"`),
        this.sapDb.raw(`"Data"->>'EmailAddress' AS "emailAddress"`),
        this.sapDb.raw(`COALESCE(("Data"->>'CreditLimit')::numeric, 0) AS "creditLimit"`),
        this.sapDb.raw(`COALESCE(("Data"->>'CurrentAccountBalance')::numeric, 0) AS "currentAccountBalance"`),
        this.sapDb.raw(`"Data"->>'Frozen' AS "frozen"`),
        this.sapDb.raw(`COALESCE(("Data"->>'SalesPersonCode')::int, -1) AS "salesPersonCode"`),
        this.sapDb.raw(`"Data"->'BPAddresses' AS "addresses"`),
      )
      .where('CompanyDb', this.companyDb)
      .where('EntityType', 'BusinessPartners')
      .whereRaw(`"Data"->>'CardType' = 'cCustomer'`)
      .whereRaw(`"Data"->>'Frozen' IS DISTINCT FROM 'tYES'`);

    if (sinceDate) {
      qb = qb.where('SyncedAt', '>', sinceDate);
    }

    return qb.orderBy('SyncedAt', 'desc');
  }

  async getConcreteItems(sinceDate?: Date): Promise<SapItemRow[]> {
    let qb = this.sapDb('sap_master_data')
      .select(
        this.sapDb.raw(`"Data"->>'ItemCode' AS "itemCode"`),
        this.sapDb.raw(`"Data"->>'ItemName' AS "itemName"`),
        this.sapDb.raw(`"Data"->>'ForeignName' AS "foreignName"`),
        this.sapDb.raw(`"Data"->>'User_Text' AS "userText"`),
        this.sapDb.raw(`"Data"->>'SalesUnit' AS "salesUnit"`),
        this.sapDb.raw(`(regexp_match("Data"->>'ItemName', 'CONCRETO\\s+(\\d+)'))[1]::integer AS "strengthPsi"`),
        this.sapDb.raw(`"Data"->>'Valid' AS "valid"`),
        this.sapDb.raw(`"Data"->>'Frozen' AS "frozen"`),
      )
      .where('CompanyDb', this.companyDb)
      .where('EntityType', 'Items')
      .whereRaw(`("Data"->>'ItemsGroupCode')::int = 113`)
      .whereRaw(`"Data"->>'Valid' = 'tYES'`)
      .whereRaw(`"Data"->>'Frozen' = 'tNO'`);

    if (sinceDate) {
      qb = qb.where('SyncedAt', '>', sinceDate);
    }

    return qb.orderByRaw(`"Data"->>'ItemCode'`);
  }

  async getOpenOrders(sinceDate?: Date): Promise<SapOrderRow[]> {
    let qb = this.sapDb('sap_documents')
      .select(
        this.sapDb.raw(`"DocEntry" AS "docEntry"`),
        this.sapDb.raw(`("Data"->>'DocNum')::int AS "docNum"`),
        this.sapDb.raw(`"CardCode" AS "cardCode"`),
        this.sapDb.raw(`"Data"->>'CardName' AS "cardName"`),
        this.sapDb.raw(`"Data"->>'DocDate' AS "docDate"`),
        this.sapDb.raw(`"Data"->>'DocDueDate' AS "docDueDate"`),
        this.sapDb.raw(`"DocTotal" AS "docTotal"`),
        this.sapDb.raw(`"DocCurrency" AS "docCurrency"`),
        this.sapDb.raw(`"Data"->>'DocumentStatus' AS "documentStatus"`),
        this.sapDb.raw(`"Cancelled" AS "cancelled"`),
        this.sapDb.raw(`"Data"->>'Comments' AS "comments"`),
        this.sapDb.raw(`COALESCE(("Data"->>'SalesPersonCode')::int, -1) AS "salesPersonCode"`),
        this.sapDb.raw(`"Data"->'DocumentLines' AS "lines"`),
      )
      .where('CompanyDb', this.companyDb)
      .where('EntityType', 'Orders')
      .where('Cancelled', 'tNO');

    if (sinceDate) {
      qb = qb.where('SyncedAt', '>', sinceDate);
    }

    return qb.orderBy('DocDate', 'desc');
  }

  async getWarehouses(): Promise<SapWarehouseRow[]> {
    return this.sapDb('sap_reference_data')
      .select(
        this.sapDb.raw(`"Data"->>'WarehouseCode' AS "warehouseCode"`),
        this.sapDb.raw(`"Data"->>'WarehouseName' AS "warehouseName"`),
        this.sapDb.raw(`"Data"->>'Inactive' AS "inactive"`),
      )
      .where('CompanyDb', this.companyDb)
      .where('EntityType', 'Warehouses')
      .whereRaw(`"Data"->>'WarehouseCode' IN ('SPSPT','TGUPT','CORPT','CEIPT','CSJPT','CHOPT','SBCPT','STELPT')`)
      .orderByRaw(`"Data"->>'WarehouseCode'`);
  }

  async getRecordCounts(): Promise<Array<{ entityType: string; count: number }>> {
    const masterData = await this.sapDb('sap_master_data')
      .select('EntityType as entityType')
      .count('* as count')
      .where('CompanyDb', this.companyDb)
      .groupBy('EntityType');

    const documents = await this.sapDb('sap_documents')
      .select('EntityType as entityType')
      .count('* as count')
      .where('CompanyDb', this.companyDb)
      .groupBy('EntityType');

    return [...masterData, ...documents].map((r) => ({
      entityType: r.entityType as string,
      count: Number(r.count),
    }));
  }
}
