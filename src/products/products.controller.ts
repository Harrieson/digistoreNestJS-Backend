import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import config from 'config';
import { Roles } from 'src/shared/middleware/role.decorators';
import { userTypes } from 'src/shared/schema/users';
import { CreateProductDto } from './dto/create-product.dto';
import { GetProductQueryDto } from './dto/get-product-query-dto';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  //Create Product as ADMIN;
  @Post()
  @HttpCode(201)
  @Roles(userTypes.ADMIN)
  async create(@Body() createProductDto: CreateProductDto) {
    return await this.productsService.create(createProductDto);
  }

  @Get()
  findAll(@Query() query: GetProductQueryDto) {
    return this.productsService.findAllProducts(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.productsService.findOneProduct(id);
  }

  @Patch(':id')
  @Roles(userTypes.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: CreateProductDto,
  ) {
    return await this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  @Post('/:id/image')
  @Roles(userTypes.ADMIN)
  @UseInterceptors(
    FileInterceptor('productImage', {
      dest: config.get('fileStoragePath'),
      limits: {
        fileSize: 3145728, // 3MB
      },
    }),
  )
  async uploadProductImage(
    @Param('id') id: string,
    @UploadedFile() file: ParameterDecorator,
  ) {
    return await this.productsService.uploadProductImage(id, file);
  }
}
