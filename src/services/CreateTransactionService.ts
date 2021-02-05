import AppError from '../errors/AppError';
import { getRepository, getCustomRepository } from 'typeorm';

import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

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

    //Verificar se o tipo de transação outcome extrapola total em caixa
    if(type == 'outcome'){
      const transactionsRepository = getCustomRepository(TransactionsRepository);
      const transactions = await transactionsRepository.find();
      const balance = await transactionsRepository.getBalance(transactions);
      if(value > balance.total){
        throw new AppError('value cannot be higher than the cash value', 400);
      }

    }

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
