



export interface PostTopic {
    categoryId?: string,
    subCategoryId?: string
}

export interface PostOrigin {
    countryId: string,
    stateId?: string,
    cityId?: string,
    areaId?: string,
}


export interface PostType {
    _id?: string,
    userId: string,
    postTitle: string,
    postTopic: PostTopic,
    postThumbnail?: string,
    postOrigin: PostOrigin,
    likes?: Array<string>
    status: boolean,
    isLive:boolean
}