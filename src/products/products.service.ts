import { Inject, Injectable } from '@nestjs/common';
import { InjectStripe } from 'nestjs-stripe';
import { ProductRepository } from 'src/shared/repositories/product.repository';
import Stripe from 'stripe';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @Inject(ProductRepository) private readonly productDB: ProductRepository,
    @InjectStripe() private readonly stripeClient: Stripe,
  ) {}
  async create(createProductDto: CreateProductDto) {
    try {
      if (!createProductDto.stripeProductId) {
        const createdProductInStripe = await this.stripeClient.products.create({
          name: createProductDto.productName,
          description: createProductDto.description,
        });
        createProductDto.stripeProductId = createdProductInStripe.id;
      }
      const createdProductInDB = await this.productDB.create(createProductDto);
      return {
        message: 'Product Created Successfully',
        result: createdProductInDB,
        success: true,
      };
    } catch (error) {
      throw error;
    }
  }

  findAll() {
    return `This action returns all products`;
  }

  async findOneProduct(id: string) {
    try {
      const product = await this.productDB.findOne({ _id: id });
      if (!product) {
        throw new Error('Product not found');
      }
      return {
        message: 'Product fetched successfully',
        result: product,
        success: true,
      };
    } catch (error) {
      throw error;
    }
  }

  async update(id: string, updateProductDto: CreateProductDto) {
    try {
      const productExist = await this.productDB.findOne({ _id: id });
      if (!productExist) {
        throw new Error('Product with this ID does not exist');
      }
      const updatedProduct = await this.productDB.findOneAndUpdate(
        { _id: id },
        updateProductDto,
      );
      if (!updateProductDto.stripeProductId)
        await this.stripeClient.products.update(productExist.stripeProductId, {
          name: updateProductDto.productName,
          description: updateProductDto.description,
        });
      return {
        message: 'Product updated successfully',
        result: updatedProduct,
        success: true,
      };
    } catch (error) {
      throw error;
    }
  }

  remove(id: number) {
    return `This action removes a #${id} product`;
  }
}
