import { Stack } from "aws-cdk-lib";
import { AttributeType, Table } from "aws-cdk-lib/aws-dynamodb";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { TABLE_NAME } from "../constants";


export class GenericTable {
    private name:string;
    private primaryKey: string;
    public table: Table;
    private stack: Stack
    private ownerLambdas: NodejsFunction[]

    public constructor (name:string,primaryKey:string, stack: Stack, ownerLambdas: NodejsFunction[]){
        this.name = name;
        this.primaryKey = primaryKey
        this.stack = stack
        this.ownerLambdas = ownerLambdas
        this.initialize()
    }

    initialize(){
        this.createTable()
    }

    createTable(){
        this.table = new Table(this.stack,this.name, {
            partitionKey:{ name:this.primaryKey, type: AttributeType.STRING },
            tableName:this.name
        })
        
        this.ownerLambdas.forEach(lambda => this.table.grantFullAccess(lambda))
    }
}