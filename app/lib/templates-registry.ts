
import templatesData from './templates.json';

export interface TemplateMeta {
    id: string;
    name: string;
    description: string;
    thumbnail: string;
    features: string[];
    category: 'Professional' | 'Creative' | 'Academic' | 'Simple';
    dimensions: {
        width: number;
        height: number;
    };
    html?: string;
    file?: string;
}

export const TEMPLATES: TemplateMeta[] = templatesData as TemplateMeta[];

export function getTemplateMeta(id: string): TemplateMeta | undefined {
    return TEMPLATES.find(t => t.id === id);
}
