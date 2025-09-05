-- Create services table
CREATE TABLE public.services (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    default_price numeric(10,2),
    unit text DEFAULT 'ცალი',
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT timezone('utc'::text, now()),
    updated_at timestamptz DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their company services" ON public.services
    FOR SELECT USING (
        company_id IN (
            SELECT id FROM public.companies 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert services for their company" ON public.services
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT id FROM public.companies 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their company services" ON public.services
    FOR UPDATE USING (
        company_id IN (
            SELECT id FROM public.companies 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their company services" ON public.services
    FOR DELETE USING (
        company_id IN (
            SELECT id FROM public.companies 
            WHERE user_id = auth.uid()
        )
    );

-- Create index for better performance
CREATE INDEX idx_services_company_id ON public.services(company_id);
CREATE INDEX idx_services_active ON public.services(is_active) WHERE is_active = true;

-- Add service_id to invoice_items table
ALTER TABLE public.invoice_items ADD COLUMN service_id uuid REFERENCES public.services(id);

-- Create index for service_id
CREATE INDEX idx_invoice_items_service_id ON public.invoice_items(service_id);