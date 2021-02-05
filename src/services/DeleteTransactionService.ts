// import AppError from '../errors/AppError';
import { getRepository } from 'typeorm';
import Transaction from '../models/Transaction';

class DeleteTransactionService {
  public async execute(id: any): Promise<void> {
    const transactionRepository = getRepository(Transaction);
    transactionRepository.delete(id);
  }
}

export default DeleteTransactionService;
