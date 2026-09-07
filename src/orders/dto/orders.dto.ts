import { Type } from 'class-transformer'
import { IsArray, IsNotEmpty, IsString, MinLength, ValidateNested } from 'class-validator'

export class PlaceOrderRequest {
    @IsString({ message: 'Cart_Item id must be a string' })
    @MinLength(36, { message: 'Cart_id must be at least 36 character long' })
    @IsNotEmpty()
    cart_id: string
}

export class PlaceOrderRequestList {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PlaceOrderRequest)
    cart_ids: PlaceOrderRequest[]
}
