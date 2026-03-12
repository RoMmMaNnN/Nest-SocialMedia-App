import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParsePositiveIntPipe implements PipeTransform<string, number> {
  transform(value: string): number {
    const num = parseInt(value, 10);
    if (isNaN(num) || num <= 0) {
      throw new BadRequestException(`${value} is not a positive integer`);
    }
    return num;
  }
}
