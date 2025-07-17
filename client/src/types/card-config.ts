export interface CardStatusConfig {
  cardId: 'total' | 'todo' | 'inProgress' | 'done';
  statusNames: string[];
  statusCategories: string[];
}

export interface CardConfigState {
  total: CardStatusConfig;
  todo: CardStatusConfig;
  inProgress: CardStatusConfig;
  done: CardStatusConfig;
}

export const DEFAULT_CARD_CONFIG: CardConfigState = {
  total: {
    cardId: 'total',
    statusNames: [],
    statusCategories: ['To Do', 'In Progress', 'Done']
  },
  todo: {
    cardId: 'todo',
    statusNames: ['aberto', 'novo', 'backlog'],
    statusCategories: ['To Do', 'new']
  },
  inProgress: {
    cardId: 'inProgress',
    statusNames: ['progresso', 'progress', 'desenvolvimento', 'em andamento'],
    statusCategories: ['In Progress', 'indeterminate']
  },
  done: {
    cardId: 'done',
    statusNames: ['concluído', 'done', 'fechado', 'resolvido'],
    statusCategories: ['Done', 'complete']
  }
};