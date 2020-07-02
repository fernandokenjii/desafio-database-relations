import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IHashedQuantity {
  [key: string]: number;
}

interface IHashedPrice {
  [key: string]: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,

    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,

    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('Invalid customer');
    }

    const existingProducts = await this.productsRepository.findAllById(
      products,
    );

    if (existingProducts.length !== products.length) {
      throw new AppError('Invalid product(s)');
    }

    const productsQuantity: IHashedQuantity = products.reduce(
      (acc, product) => ({ ...acc, [product.id]: product.quantity }),
      {},
    );

    const isQuantitySuficient = existingProducts.every(
      product => product.quantity >= productsQuantity[product.id],
    );

    if (!isQuantitySuficient) {
      throw new AppError('Insuficient quantities');
    }

    await this.productsRepository.updateQuantity(products);

    const productsPrice: IHashedPrice = existingProducts.reduce(
      (acc, product) => ({ ...acc, [product.id]: product.price }),
      {},
    );

    const orderProducts = products.map(product => ({
      product_id: product.id,
      quantity: product.quantity,
      price: productsPrice[product.id],
    }));

    const order = await this.ordersRepository.create({
      customer,
      products: orderProducts,
    });

    return order;
  }
}

export default CreateOrderService;
