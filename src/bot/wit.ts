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

export class WitBot {
  public static getOutcomes(message: string) {
    return wit.message(message).then((data: IWitResponse) => {
      const outcomes = [];

      for (const outcome of data.outcomes) {
        if (outcome.confidence > confidenceThreshold) {
          outcomes.push(outcome);
        }
      }

      return outcomes;
    });
  }

  public static getBestOutcome(message: string): Promise<IWitOutcome> {
    return wit.message(message).then((data: IWitResponse) => {
      if (!data || !data.outcomes) { return null; }

      return data.outcomes.reduce((bestOutcome: IWitOutcome, outcome: IWitOutcome) => {
        if (outcome.confidence > bestOutcome.confidence) { return outcome; }
      });
    });
  }

  public static runAction(message: string, platform, target): Promise<any> {
    return WitBot.getBestOutcome(message).then((outcome: IWitOutcome) => {
      Actions[outcome.intent](outcome.entities, platform, target);
    });
  }
}
