-- Add subscription and revenue tracking tables
CREATE TABLE IF NOT EXISTS provider_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provider_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    plan_type TEXT NOT NULL CHECK (plan_type IN ('basic', 'premium', 'enterprise')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'suspended')),
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_revenue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('commission', 'subscription')),
    amount DECIMAL(10,2) NOT NULL,
    provider_id UUID REFERENCES profiles(id),
    appointment_id UUID REFERENCES appointments(id),
    subscription_id UUID REFERENCES provider_subscriptions(id),
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to calculate commission from appointments
CREATE OR REPLACE FUNCTION calculate_commission()
RETURNS TRIGGER AS $$
BEGIN
    -- When appointment is completed, add 15% commission to admin revenue
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        INSERT INTO admin_revenue (
            transaction_type,
            amount,
            provider_id,
            appointment_id,
            status
        ) VALUES (
            'commission',
            NEW.total_amount * 0.15, -- 15% commission
            NEW.provider_id,
            NEW.id,
            'completed'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for commission calculation
DROP TRIGGER IF EXISTS appointment_commission_trigger ON appointments;
CREATE TRIGGER appointment_commission_trigger
    AFTER UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION calculate_commission();

-- Function to handle subscription payments
CREATE OR REPLACE FUNCTION process_subscription_payment(
    p_provider_id UUID,
    p_plan_type TEXT,
    p_amount DECIMAL
)
RETURNS UUID AS $$
DECLARE
    subscription_id UUID;
    end_date TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Calculate end date (1 month from now)
    end_date := NOW() + INTERVAL '1 month';
    
    -- Create subscription record
    INSERT INTO provider_subscriptions (
        provider_id,
        plan_type,
        end_date,
        amount
    ) VALUES (
        p_provider_id,
        p_plan_type,
        end_date,
        p_amount
    ) RETURNING id INTO subscription_id;
    
    -- Add to admin revenue
    INSERT INTO admin_revenue (
        transaction_type,
        amount,
        provider_id,
        subscription_id,
        status
    ) VALUES (
        'subscription',
        p_amount,
        p_provider_id,
        subscription_id,
        'completed'
    );
    
    RETURN subscription_id;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE provider_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_revenue ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Providers can view own subscriptions" ON provider_subscriptions
    FOR SELECT USING (provider_id = auth.uid());

CREATE POLICY "Admins can manage all subscriptions" ON provider_subscriptions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Only admins can view revenue" ON admin_revenue
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
