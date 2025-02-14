import { Prisma, User } from "@prisma/client";
import { userSearchableFields } from "./user.const";
import { paginationHelper } from "../../helpers/paginationHelpers";
import { IPaginationOptions } from "../../interface/pagination";
import prisma from "../../shared/prisma";
import bcrypt from "bcrypt"
import ApiError from "../../errors/ApiError";
import httpStatus from "http-status";





const createUser = async(payload:User)=>{


const isUserExits = await prisma.user.findUnique({
    where:{
        email:payload.email
    }
})

if(isUserExits){
    throw new ApiError(httpStatus.BAD_REQUEST,"User alrady registered")
}



    const hashedPassword = await bcrypt.hash(payload.password, 12);
    const userData = {
        name :payload.name,
        email: payload.email,
        password: hashedPassword,
    }
    const result = await prisma.user.create({
        data:userData, 
        select:{
            id:true,
            name:true,
            email:true,
            createdAt:true,
            updatedAt:true
        }
    })

    return result
}





const getAllUser = async (params:any, options:IPaginationOptions) => {
 
    const { searchTerm, ...filterData } = params;
 
    const { limit, page, sortBy, sortOrder, skip } = paginationHelper.calculatePagination(options)
    const andConditions: Prisma.UserWhereInput[] = [];


    if (searchTerm) {
        andConditions.push({
            OR: userSearchableFields.map(field => ({
                [field]: {
                    contains:searchTerm,
                    mode: "insensitive"
                }
            }))
        })
    }


    if (Object.keys(filterData).length > 0) {
        andConditions.push({
            AND: Object.keys(filterData).map(key => ({
                [key]: {
                    equals: (filterData as any)[key]
                }
            }))
        })
    }



    const whereConditions: Prisma.UserWhereInput = { AND: andConditions }
    // console.dir(andConditions,{depth:"infinity"});
    const result = await prisma.user.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy: sortBy && sortOrder ? {
            [sortBy]: sortOrder
        } : {
            createdAt: "desc"
        },
        select:{
           id:true,
           email:true,
           name:true,
           createdAt:true,
           updatedAt:true,
        }
    })

    const total = await prisma.user.count({
        where: whereConditions
    })
    return {
        meta: {
            page,
            limit,
            total
        },
        data: result
    }
}


const getMe = async(email:string)=>{
const result = await prisma.user.findUniqueOrThrow({
    where:{
        email
    },
    select:{
        id:true,
        name:true,
        email:true,
        createdAt:true,
        updatedAt:true
    }
})

return result;
}






export const UserServices = {
    getAllUser,
    createUser,
    getMe
}