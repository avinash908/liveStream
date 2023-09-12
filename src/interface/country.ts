

export interface CountryType {
    country: string,
    status: boolean
}

export interface StateType {
    countryId: string,
    state: string,
    status: boolean
}


export interface CityType {
    countryId: string,
    stateId: string,
    city: string,
    status: boolean
}

export interface AreaType {
    countryId: string,
    stateId: string,
    cityId: string,
    area: string,
    status: boolean
}