declare module 'dom-to-image-more' {
    export interface DomToImageOptions {
      /** Quality level between 0 and 1 for JPEG and WEBP images */
      quality?: number;
      /** Pixel ratio of the generated image */
      scale?: number;
      /** Background color, e.g. 'white' or 'transparent' */
      bgcolor?: string;
      /** Only include nodes that pass the provided test function */
      filter?: (node: HTMLElement) => boolean;
      /** Width of the generated image */
      width?: number;
      /** Height of the generated image */
      height?: number;
      /** Use CORS proxy */
      cacheBust?: boolean;
      /** Style to be attached to node to render */
      style?: object;
      /** Add watermark to resulting image */
      imagePlaceholder?: string;
    }
  
    /**
     * Converts DOM node to PNG image
     * @param node DOM node to convert
     * @param options Conversion options
     * @returns Promise that resolves to a PNG data URL
     */
    export function toPng(node: HTMLElement, options?: DomToImageOptions): Promise<string>;
  
    /**
     * Converts DOM node to JPEG image
     * @param node DOM node to convert
     * @param options Conversion options
     * @returns Promise that resolves to a JPEG data URL
     */
    export function toJpeg(node: HTMLElement, options?: DomToImageOptions): Promise<string>;
  
    /**
     * Converts DOM node to BMP image
     * @param node DOM node to convert
     * @param options Conversion options
     * @returns Promise that resolves to a BMP data URL
     */
    export function toBmp(node: HTMLElement, options?: DomToImageOptions): Promise<string>;
  
    /**
     * Converts DOM node to SVG image
     * @param node DOM node to convert
     * @param options Conversion options
     * @returns Promise that resolves to an SVG data URL
     */
    export function toSvg(node: HTMLElement, options?: DomToImageOptions): Promise<string>;
  
    /**
     * Converts DOM node to a Blob
     * @param node DOM node to convert
     * @param options Conversion options
     * @returns Promise that resolves to a Blob
     */
    export function toBlob(node: HTMLElement, options?: DomToImageOptions): Promise<Blob>;
  
    /**
     * Converts DOM node to a Pixel data
     * @param node DOM node to convert
     * @param options Conversion options
     * @returns Promise that resolves to pixel data
     */
    export function toPixelData(node: HTMLElement, options?: DomToImageOptions): Promise<Uint8ClampedArray>;
  
    export default {
      toPng,
      toJpeg,
      toBmp,
      toSvg,
      toBlob,
      toPixelData
    };
  }