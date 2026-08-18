import { IsEmail, IsEnum, IsOptional, IsString, MaxLength } from "class-validator";
import { Language } from "@prisma/client";


export class UpdateCustomerDto{
    @IsOptional()
    @IsString()
    @MaxLength(100)
    name?:string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsEnum(Language)
    language?: Language;

}