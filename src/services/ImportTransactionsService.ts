import {getCustomRepository, getRepository, In} from 'typeorm'
import csvParse from 'csv-parse';
import fs from 'fs';

import uploadConfig from '../config/upload';
import Transaction from '../models/Transaction';
import CreateTransactionService from '../services/CreateTransactionService';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface TransactionImport {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute(filePath: string): Promise<any[]> {

    // const csvFilePath = path.resolve(uploadConfig.directory, filename);
    const readCSVStream = fs.createReadStream(filePath);

    const parseStream = csvParse({
      from_line: 2
    });

    const parseCSV = readCSVStream.pipe(parseStream);

    const transactionslines:Array<TransactionImport> = [];

    const transactions: TransactionImport[] = [];
    const categories: string[] = [];

    parseCSV.on('data', async line => {
      const [ title, type, value, category ] = line.map((cell: string) =>
        cell.trim(),
      );

      if( !title || !type || !value ) return;

      categories.push(category);
      transactions.push({title, type, value, category});
    });



    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    const categoryRepository = getRepository(Category);
    const existenCategories = await categoryRepository.find({
      where: {
        title: In(categories),
      }
    });

    const existentCategoriesTitle = existenCategories.map(
      (category: Category) => category.title
    );

    const addCategoryTitles = categories.filter(
      category => !existentCategoriesTitle.includes(category),
    ).filter((value, index, self) => self.indexOf(value) == index);

    const newCategories = categoryRepository.create(
      addCategoryTitles.map(title => ({
        title,
      })),
    );

    await categoryRepository.save(newCategories);

    const finalCategories = [...newCategories, ...existenCategories];

    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const createdTransactions = transactionsRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: finalCategories.find(
          category => category.title == transaction.category,
        ),
      }))
    );

    await transactionsRepository.save(createdTransactions);
    await fs.promises.unlink(filePath);

    return createdTransactions;

    // const createTransactionService = new CreateTransactionService();
    // const arrayTransactions:Array<TransactionImport> = [];

    // transactionslines.map(async ({title, value, type, category}:TransactionImport) => {
    //   await createTransactionService.execute({title, value, type, category});

    // });

    return transactionslines;

  }
}

export default ImportTransactionsService;
