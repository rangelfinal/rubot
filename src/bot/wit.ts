import { log, Wit } from 'node-wit';
import Actions from './actions';

const confidenceThreshold: number = 0.7;

const wit = new Wit({
  accessToken: process.env.WITACCESSTOKEN,
  logger: new log.Logger(log.DEBUG), // optional
});

export type IWitEntities = any;  // TODO: Fix type

export interface IWitOutcome {
  _text: string;
  intent: string;
  entities: IWitEntities;
  confidence: number;
}

export interface IWitResponse {
  msg_id: string;
  _text: string;
  outcomes: IWitOutcome[];
}

export interface IWitContext {
  state: string | string[];
  reference_time?: string;
  timezone?: string;
  entities?: IWitEntities;
  location?: any;
}

export class WitBot {
  public static getOutcomes(message: string, context?: IWitContext) {
    return wit.message(message, context).then((data: IWitResponse) => {
      const outcomes = [];

      for (const outcome of data.outcomes) {
        if (outcome.confidence > confidenceThreshold) {
          outcomes.push(outcome);
        }
      }

      return outcomes;
    });
  }

  public static getBestOutcome(message: string, context?: IWitContext): Promise<IWitOutcome> {
    return wit.message(message, context).then((data: IWitResponse) => {
      if (!data || !data.outcomes) { return null; }

      return data.outcomes.reduce((bestOutcome: IWitOutcome, outcome: IWitOutcome) => {
        if (outcome.confidence > bestOutcome.confidence) { return outcome; }
      });
    });
  }

  public static runAction(message: string, platform, target, context?: IWitContext): Promise<any> {
    return WitBot.getBestOutcome(message, context).then((outcome: IWitOutcome) => {
      if (!outcome || !Actions[outcome.intent]) { return Actions.fallback(null, platform, target); }
      return Actions[outcome.intent](outcome.entities, platform, target);
    });
  }
}
