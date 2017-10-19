import MenuContents from '../restaurants/menuContents';

export default abstract class Platform {
  public abstract sendText(text: string, target: string): Promise<any>;
  public abstract sendRichMessage(type: string, payload: any, target: string): Promise<any>;

  public abstract sendMenuContents(menuContents: MenuContents, target: string);
}
