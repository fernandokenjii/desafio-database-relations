import { getRepository, Repository, In } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

interface IHashedQuantity {
  [key: string]: number;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = this.ormRepository.create({
      name,
      price,
      quantity,
    });

    await this.ormRepository.save(product);

    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const product = await this.ormRepository.findOne({
      where: {
        name,
      },
    });

    return product;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const products_id = products.map(product => product.id);

    const productsById = await this.ormRepository.find({
      where: {
        id: In(products_id),
      },
    });

    return productsById;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const products_id = products.map(product => product.id);

    const productsById = await this.ormRepository.find({
      where: {
        id: In(products_id),
      },
    });

    const productsQuantity: IHashedQuantity = products.reduce(
      (acc, product) => ({ ...acc, [product.id]: product.quantity }),
      {},
    );

    const updatedProducts = productsById.map(product => ({
      ...product,
      quantity: product.quantity - productsQuantity[product.id],
    }));

    await this.ormRepository.save(updatedProducts);

    return updatedProducts;
  }
}

export default ProductsRepository;
