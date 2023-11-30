import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  SkuDetails,
  baseType,
  categoryType,
  platformType,
} from 'src/shared/schema/products';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  productName: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  image?: string;

  @IsOptional()
  imageDetails?: Record<string, any>;

  @IsString()
  @IsNotEmpty()
  @IsEnum(categoryType)
  category: string;

  @IsString()
  @IsNotEmpty()
  @IsEnum(platformType)
  platformType: string;

  @IsNotEmpty()
  @IsString()
  @IsEnum(baseType)
  baseType: string;

  @IsString()
  @IsNotEmpty()
  productUrl: string;

  @IsString()
  @IsNotEmpty()
  downloadUrl: string;

  @IsString()
  @IsNotEmpty()
  requirementSpecification: Record<string, any>[];

  @IsString()
  @IsNotEmpty()
  highlights: string[];

  @IsOptional()
  @IsArray()
  skuDetails: SkuDetails[];

  @IsOptional()
  stripeProductId: string;
}
