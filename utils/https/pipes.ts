/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { BadRequestException, Injectable, ValidationError, ValidationPipe } from '@nestjs/common'

@Injectable()
export class HttpCustomValidationPipe extends ValidationPipe {
    constructor() {
        super({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true
        })
    }

    public override createExceptionFactory() {
        return function (validationErrors?: ValidationError[]) {
            const errorMap = new Map()

            function recursiveErrorTracerFn(errors: ValidationError[], parentPath = '') {
                errors.forEach(error => {
                    const path = parentPath ? `${parentPath}.${error.property}` : error.property

                    if (error.constraints) {
                        errorMap.set(path, Object.values(error.constraints))
                    }

                    if (error.children && error.children.length > 0) {
                        recursiveErrorTracerFn(error.children, path)
                    }
                })
            }

            if (validationErrors) {
                recursiveErrorTracerFn(validationErrors)
                return new BadRequestException({
                    message: 'Validation Failed',
                    error: Object.fromEntries(errorMap),
                    statusCode: 400
                })
            }
        }
    }
}
