import { ArgumentMetadata, HttpException, HttpStatus, Injectable, PipeTransform } from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'

@Injectable()
export class HttpValidationPipe implements PipeTransform<any> {
    async transform(value: any, { metatype }: ArgumentMetadata) {
        if (!metatype || !this.toValidate(metatype)) {
            return value
        }
        const object = plainToInstance(metatype, value)
        const errors = await validate(object)
        if (errors.length > 0) {
            const mapErrors = errors.map(err => ({
                field: err.property,
                constraints: err.constraints
            }))

            throw new HttpException({ message: 'validation_fails', validationExceptions: mapErrors }, HttpStatus.BAD_REQUEST)
        }
        return value
    }

    private toValidate(metatype: Function): boolean {
        const types: Function[] = [String, Boolean, Number, Array, Object]
        return !types.includes(metatype)
    }
}
