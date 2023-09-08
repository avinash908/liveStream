
export interface AddressType {
    city: string,
    state: string,
    zipCode: string,
    subDivision: string,
    country: string,
}

export interface UserType {
    id?: string,
    username: string,
    email: string,
    password: string,
    token?: string,
    follower?: Array<string>,
    following?: Array<string>,
    status?: boolean,
    address?: AddressType,
    userType:string,
}