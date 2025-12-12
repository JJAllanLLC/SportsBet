-- Add column to track deposits
alter table profiles add column if not exists has_deposited boolean default false;

-- Create function to award 10k points when referred user deposits
create or replace function award_referral_deposit_bonus()
returns trigger as $$
declare
  referrer_id uuid;
  referral_code text;
begin
  -- Get the referral code used to sign up this user
  select metadata->>'referral_code' into referral_code
  from auth.users 
  where id = new.id;

  -- Find the referrer's user ID from their referral code
  select id into referrer_id
  from profiles
  where my_referral_code = referral_code;

  -- Only award if there's a valid referrer and this is their first deposit
  if referrer_id is not null 
     and referrer_id != new.id 
     and new.has_deposited = true 
     and old.has_deposited is false then
     
    update profiles 
    set points = points + 10000 
    where id = referrer_id;
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- Create trigger
drop trigger if exists referral_deposit_bonus on profiles;
create trigger referral_deposit_bonus
  after update of has_deposited on profiles
  for each row
  when (old.has_deposited is false and new.has_deposited is true)
  execute function award_referral_deposit_bonus();

