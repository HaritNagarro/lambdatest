export const AWS_ACCOUNT_ID:string = '228733100300'
export const AWS_REGION:string = 'ap-south-1'

export const getPreBucketName = () => `pre-bucket-${AWS_ACCOUNT_ID}-${AWS_REGION}`
export const TABLE_NAME = 'records' 
export const TABLE_PK = 'objectPath'