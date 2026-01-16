import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/stores/app';
import type { PactTemplate, TemplateCategory } from '@/lib/pactTemplates';

export interface UserPactTemplate extends PactTemplate {
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateTemplateParams {
  name: string;
  description?: string;
  icon?: string;
  category?: TemplateCategory;
  suggestedFrequency: 'daily' | 'weekly' | 'custom';
  suggestedFrequencyDays?: number[];
  suggestedRoastLevel?: 1 | 2 | 3;
  suggestedProofRequired?: 'none' | 'optional' | 'required';
  suggestedPactType?: 'individual' | 'group' | 'relay';
}

interface UseTemplatesReturn {
  userTemplates: UserPactTemplate[];
  isLoading: boolean;
  error: string | null;
  fetchUserTemplates: () => Promise<void>;
  createTemplate: (params: CreateTemplateParams) => Promise<UserPactTemplate | null>;
  deleteTemplate: (templateId: string) => Promise<boolean>;
  saveAsTemplate: (pact: {
    name: string;
    description?: string | null;
    frequency: 'daily' | 'weekly' | 'custom';
    frequencyDays?: number[] | null;
    roastLevel: 1 | 2 | 3;
    proofRequired: 'none' | 'optional' | 'required';
    pactType: 'individual' | 'group' | 'relay';
  }) => Promise<UserPactTemplate | null>;
}

export function useTemplates(): UseTemplatesReturn {
  const [userTemplates, setUserTemplates] = useState<UserPactTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const user = useAppStore((state) => state.user);

  // Fetch user's custom templates
  const fetchUserTemplates = useCallback(async () => {
    if (!user) {
      setUserTemplates([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('user_pact_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Fetch templates error:', fetchError);
        setError('Failed to load templates');
        return;
      }

      // Transform database format to template format
      const templates: UserPactTemplate[] = (data || []).map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description || '',
        icon: row.icon || '\u{2B50}',
        category: row.category as TemplateCategory,
        suggestedFrequency: row.suggested_frequency as 'daily' | 'weekly' | 'custom',
        suggestedFrequencyDays: row.suggested_frequency_days,
        suggestedRoastLevel: row.suggested_roast_level as 1 | 2 | 3,
        suggestedProofRequired: row.suggested_proof_required as 'none' | 'optional' | 'required',
        suggestedPactType: row.suggested_pact_type as 'individual' | 'group' | 'relay',
        isBuiltIn: false,
        userId: row.user_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      setUserTemplates(templates);
    } catch (err) {
      console.error('Fetch templates exception:', err);
      setError('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Auto-fetch on mount and when user changes
  useEffect(() => {
    fetchUserTemplates();
  }, [fetchUserTemplates]);

  // Create a new custom template
  const createTemplate = useCallback(
    async (params: CreateTemplateParams): Promise<UserPactTemplate | null> => {
      if (!user) {
        setError('You must be logged in to create a template');
        return null;
      }

      const trimmedName = params.name.trim();
      if (trimmedName.length < 2 || trimmedName.length > 50) {
        setError('Template name must be 2-50 characters');
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const { data, error: createError } = await supabase
          .from('user_pact_templates')
          .insert({
            user_id: user.id,
            name: trimmedName,
            description: params.description?.trim() || null,
            icon: params.icon || '\u{2B50}',
            category: params.category || 'custom',
            suggested_frequency: params.suggestedFrequency,
            suggested_frequency_days: params.suggestedFrequency === 'custom'
              ? params.suggestedFrequencyDays
              : null,
            suggested_roast_level: params.suggestedRoastLevel || 2,
            suggested_proof_required: params.suggestedProofRequired || 'optional',
            suggested_pact_type: params.suggestedPactType || 'individual',
          })
          .select()
          .single();

        if (createError) {
          console.error('Create template error:', createError);
          setError('Failed to create template');
          return null;
        }

        const template: UserPactTemplate = {
          id: data.id,
          name: data.name,
          description: data.description || '',
          icon: data.icon || '\u{2B50}',
          category: data.category as TemplateCategory,
          suggestedFrequency: data.suggested_frequency as 'daily' | 'weekly' | 'custom',
          suggestedFrequencyDays: data.suggested_frequency_days,
          suggestedRoastLevel: data.suggested_roast_level as 1 | 2 | 3,
          suggestedProofRequired: data.suggested_proof_required as 'none' | 'optional' | 'required',
          suggestedPactType: data.suggested_pact_type as 'individual' | 'group' | 'relay',
          isBuiltIn: false,
          userId: data.user_id,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };

        // Add to local state
        setUserTemplates((prev) => [template, ...prev]);

        return template;
      } catch (err) {
        console.error('Create template exception:', err);
        setError('Something went wrong');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  // Delete a custom template
  const deleteTemplate = useCallback(
    async (templateId: string): Promise<boolean> => {
      if (!user) {
        setError('You must be logged in');
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        const { error: deleteError } = await supabase
          .from('user_pact_templates')
          .delete()
          .eq('id', templateId)
          .eq('user_id', user.id);

        if (deleteError) {
          console.error('Delete template error:', deleteError);
          setError('Failed to delete template');
          return false;
        }

        // Remove from local state
        setUserTemplates((prev) => prev.filter((t) => t.id !== templateId));

        return true;
      } catch (err) {
        console.error('Delete template exception:', err);
        setError('Something went wrong');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  // Save a pact as a template
  const saveAsTemplate = useCallback(
    async (pact: {
      name: string;
      description?: string | null;
      frequency: 'daily' | 'weekly' | 'custom';
      frequencyDays?: number[] | null;
      roastLevel: 1 | 2 | 3;
      proofRequired: 'none' | 'optional' | 'required';
      pactType: 'individual' | 'group' | 'relay';
    }): Promise<UserPactTemplate | null> => {
      return createTemplate({
        name: pact.name,
        description: pact.description || undefined,
        suggestedFrequency: pact.frequency,
        suggestedFrequencyDays: pact.frequencyDays || undefined,
        suggestedRoastLevel: pact.roastLevel,
        suggestedProofRequired: pact.proofRequired,
        suggestedPactType: pact.pactType,
      });
    },
    [createTemplate]
  );

  return {
    userTemplates,
    isLoading,
    error,
    fetchUserTemplates,
    createTemplate,
    deleteTemplate,
    saveAsTemplate,
  };
}
