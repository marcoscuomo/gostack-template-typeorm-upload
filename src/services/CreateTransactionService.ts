// import AppError from '../errors/AppError';
import { getRepository } from 'typeorm';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface RequestDTO{
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({title, value, type, category}: RequestDTO): Promise<Transaction> {

    // Verificar se a categoria já existe
    const categoryRepository = getRepository(Category);
    const transactionRepository = getRepository(Transaction);

    const categoryTransaction = await categoryRepository.findOne({
      where: { title: category }
    });

    var categoryId = '';
    if(!categoryTransaction){
      // Salvar categoria
      const categoryNew = categoryRepository.create({title: category});
      const categoryCreated =  await categoryRepository.save(categoryNew);
      categoryId = categoryCreated.id;
    }else {
      categoryId = categoryTransaction.id;
    }

    const transaction = transactionRepository.create({
      title,
      value,
      type,
      category_id: categoryId
    });


    await transactionRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
