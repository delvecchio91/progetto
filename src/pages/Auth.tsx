import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { GlassCard } from "@/components/ui/GlassCard";
import { LanguageSelector } from "@/components/LanguageSelector";
import { PhoneInput } from "@/components/PhoneInput";
import { motion } from "framer-motion";
import { Eye, EyeOff, Cpu, ArrowRight, CheckCircle2, XCircle, Loader2, Mail, KeyRound } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { z } from "zod";

const Auth = () => {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [checkingCode, setCheckingCode] = useState(false);
  const [codeStatus, setCodeStatus] = useState<"idle" | "valid" | "invalid">("idle");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [registeredUserId, setRegisteredUserId] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  
  const [formData, setFormData] = useState({
    inviteCode: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if user arrived via invite link and pre-fill invite code, or mode param
  useEffect(() => {
    const refCode = searchParams.get("ref");
    const mode = searchParams.get("mode");
    
    if (refCode) {
      setFormData(prev => ({ ...prev, inviteCode: refCode.toUpperCase() }));
      setIsLogin(false); // Switch to registration mode
    } else if (mode === "register") {
      setIsLogin(false);
    } else if (mode === "login") {
      setIsLogin(true);
    }
  }, [searchParams]);

  // Check if user arrived via recovery link
  useEffect(() => {
    const type = searchParams.get("type");
    if (type === "recovery") {
      // Check if there's a valid session (user clicked recovery link)
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setIsRecoveryMode(true);
        }
      });
    }
  }, [searchParams]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword.length < 8) {
      setErrors({ newPassword: t("passwordMin") });
      return;
    }
    
    if (newPassword !== confirmNewPassword) {
      setErrors({ confirmNewPassword: t("passwordMismatch") });
      return;
    }
    
    setLoading(true);
    setErrors({});
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      
      if (error) throw error;
      
      toast({
        title: t("passwordUpdated"),
        description: t("loginSuccess"),
      });
      
      // Clear recovery mode and redirect
      setIsRecoveryMode(false);
      navigate("/");
    } catch (error: any) {
      toast({
        title: t("error"),
        description: error.message || t("genericError"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const registerSchema = z.object({
    inviteCode: z.string().min(1, t("inviteCodeRequired")),
    email: z.string().email(t("emailInvalid")).max(255),
    phone: z.string().min(6, t("phoneRequired")).max(20),
    password: z.string().min(8, t("passwordMin")).max(72),
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t("passwordMismatch"),
    path: ["confirmPassword"],
  });

  const loginSchema = z.object({
    email: z.string().email(t("emailInvalid")),
    password: z.string().min(1, t("passwordRequired")),
  });

  const getAuthErrorMessage = (error: any): string => {
    const code = error?.code || error?.message || "";
    
    if (code.includes("user_already_exists") || code.includes("already registered")) {
      return t("userExists");
    }
    if (code.includes("invalid_credentials") || code.includes("Invalid login")) {
      return t("invalidCredentials");
    }
    if (code.includes("email_not_confirmed")) {
      return t("emailNotConfirmed");
    }
    if (code.includes("too_many_requests") || code.includes("rate_limit")) {
      return t("tooManyRequests");
    }
    if (code.includes("weak_password")) {
      return t("weakPassword");
    }
    
    return error.message || t("genericError");
  };

  const validateInviteCode = async (code: string): Promise<boolean> => {
    if (code.length < 6) return false;
    
    setCheckingCode(true);
    try {
      const { data, error } = await supabase
        .from("invite_codes")
        .select("id, is_active")
        .eq("code", code.toUpperCase())
        .eq("is_active", true)
        .single();
      
      if (error || !data) {
        setCodeStatus("invalid");
        return false;
      }
      
      setCodeStatus("valid");
      return true;
    } catch {
      setCodeStatus("invalid");
      return false;
    } finally {
      setCheckingCode(false);
    }
  };

  const handleInviteCodeChange = async (value: string) => {
    const upperValue = value.toUpperCase();
    setFormData({ ...formData, inviteCode: upperValue });
    setCodeStatus("idle");
    setErrors({ ...errors, inviteCode: "" });
    
    if (upperValue.length >= 8) {
      await validateInviteCode(upperValue);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetEmail.trim()) {
      toast({
        title: t("error"),
        description: t("emailInvalid"),
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
        redirectTo: `${window.location.origin}/auth?type=recovery`,
      });
      
      if (error) throw error;
      
      setResetEmailSent(true);
      toast({
        title: t("checkEmail"),
        description: t("resetPasswordSent"),
      });
    } catch (error: any) {
      toast({
        title: t("error"),
        description: t("resetPasswordError"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async (email: string, userId: string) => {
    if (!email || !userId) {
      toast({
        title: t("error"),
        description: t("emailResendError"),
        variant: "destructive",
      });
      return;
    }

    setResendingEmail(true);
    try {
      // Create new verification token
      const { data: tokenData, error: tokenError } = await supabase.functions.invoke(
        "create-verification-token",
        {
          body: { userId, email },
        }
      );

      if (tokenError || !tokenData?.success) {
        throw new Error("Failed to create verification token");
      }

      // Send confirmation email via Brevo
      const confirmationUrl = `${window.location.origin}/verify-email?token=${tokenData.token}`;
      
      const { error: emailError } = await supabase.functions.invoke(
        "send-confirmation-email",
        {
          body: {
            email,
            confirmationUrl,
            username: email.split("@")[0],
          },
        }
      );

      if (emailError) {
        throw new Error("Failed to send email");
      }

      toast({
        title: t("checkEmail"),
        description: t("emailResent"),
      });
    } catch (error: any) {
      console.error("Error resending email:", error);
      toast({
        title: t("error"),
        description: t("emailResendError"),
        variant: "destructive",
      });
    } finally {
      setResendingEmail(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      if (isLogin) {
        const result = loginSchema.safeParse(formData);
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) fieldErrors[err.path[0].toString()] = err.message;
          });
          setErrors(fieldErrors);
          setLoading(false);
          return;
        }

        const { data: authData, error } = await supabase.auth.signInWithPassword({
          email: formData.email.trim(),
          password: formData.password,
        });

        if (error) throw error;

        // Check if email is verified in profiles
        if (authData.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("email_verified")
            .eq("user_id", authData.user.id)
            .single();

          if (profile && profile.email_verified === false) {
            // Email not verified - sign out and store user info for resend
            const userId = authData.user.id;
            const userEmail = formData.email.trim();
            await supabase.auth.signOut();
            setUnverifiedEmail(userEmail);
            setRegisteredUserId(userId);
            toast({
              title: t("error"),
              description: t("emailNotConfirmed"),
              variant: "destructive",
            });
            setLoading(false);
            return;
          }
        }
        
        // Save remember me preference
        if (rememberMe) {
          localStorage.setItem("rememberMe", "true");
        } else {
          localStorage.removeItem("rememberMe");
          sessionStorage.setItem("sessionOnly", "true");
        }
        
        toast({
          title: t("welcomeBack"),
          description: t("loginSuccess"),
        });
        navigate("/");
      } else {
        const result = registerSchema.safeParse(formData);
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) fieldErrors[err.path[0].toString()] = err.message;
          });
          setErrors(fieldErrors);
          setLoading(false);
          return;
        }

        const isValidCode = await validateInviteCode(formData.inviteCode);
        if (!isValidCode) {
          setErrors({ inviteCode: t("inviteCodeInvalid") });
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: formData.email.trim(),
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              phone: formData.phone.trim(),
              inviter_code: formData.inviteCode.toUpperCase(),
            },
          },
        });

        if (error) throw error;

        // If user was created, send verification email via Resend
        if (data.user) {
          // IMPORTANT: Sign out immediately after registration to prevent auto-login
          await supabase.auth.signOut();
          
          // Store user id for resend functionality
          setRegisteredUserId(data.user.id);
          
          try {
            // Create verification token
            const { data: tokenData, error: tokenError } = await supabase.functions.invoke(
              "create-verification-token",
              {
                body: { userId: data.user.id, email: formData.email.trim() },
              }
            );

            if (tokenError || !tokenData?.success) {
              console.error("Failed to create verification token:", tokenError);
            } else {
              // Send confirmation email via Brevo
              const confirmationUrl = `${window.location.origin}/verify-email?token=${tokenData.token}`;
              
              const { error: emailError } = await supabase.functions.invoke(
                "send-confirmation-email",
                {
                  body: {
                    email: formData.email.trim(),
                    confirmationUrl,
                    username: formData.email.split("@")[0],
                  },
                }
              );

              if (emailError) {
                console.error("Failed to send confirmation email:", emailError);
              }
            }
          } catch (emailErr) {
            console.error("Error sending verification email:", emailErr);
          }
        }

        // Show email confirmation message
        setRegisteredEmail(formData.email.trim());
        setEmailSent(true);
        
        toast({
          title: t("checkEmail"),
          description: t("confirmationEmailSent"),
        });
      }
    } catch (error: any) {
      const message = getAuthErrorMessage(error);
      toast({
        title: t("error"),
        description: message,
        variant: "destructive",
      });
      
      if (message.includes("email") || message.includes("Email") || message.includes("e-mail")) {
        setErrors({ email: message });
      }
    } finally {
      setLoading(false);
    }
  };

  // Update password screen (after clicking recovery link)
  if (isRecoveryMode) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-6"
        >
          <div className="flex justify-end">
            <LanguageSelector />
          </div>

          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/20 mb-4">
              <KeyRound className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              {t("resetPasswordTitle")}
            </h1>
          </div>

          <GlassCard className="p-6">
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <p className="text-sm text-muted-foreground text-center mb-4">
                {t("newPassword")}
              </p>
              
              <div className="space-y-2">
                <Label htmlFor="newPassword">{t("newPassword")}</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    placeholder={t("passwordPlaceholder")}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-background/50 pr-10"
                    maxLength={72}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.newPassword && <p className="text-xs text-destructive">{errors.newPassword}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmNewPassword">{t("confirmNewPassword")}</Label>
                <div className="relative">
                  <Input
                    id="confirmNewPassword"
                    type={showConfirmNewPassword ? "text" : "password"}
                    placeholder={t("passwordPlaceholder")}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="bg-background/50 pr-10"
                    maxLength={72}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showConfirmNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmNewPassword && <p className="text-xs text-destructive">{errors.confirmNewPassword}</p>}
              </div>

              <Button type="submit" className="w-full gradient-primary" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t("loading")}
                  </>
                ) : (
                  <>
                    {t("updatePassword")}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </GlassCard>
        </motion.div>
      </div>
    );
  }

  // Password reset request screen
  if (showResetPassword) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-6"
        >
          <div className="flex justify-end">
            <LanguageSelector />
          </div>

          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/20 mb-4">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              {t("resetPasswordTitle")}
            </h1>
          </div>

          {resetEmailSent ? (
            <>
              <GlassCard className="p-6 text-center space-y-4">
                <p className="text-muted-foreground">
                  {t("resetPasswordSent")}
                </p>
                <p className="text-primary font-medium text-lg">
                  {resetEmail}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("emailConfirmationNote")}
                </p>
              </GlassCard>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setShowResetPassword(false);
                  setResetEmailSent(false);
                  setResetEmail("");
                }}
              >
                {t("backToLogin")}
              </Button>
            </>
          ) : (
            <>
              <GlassCard className="p-6">
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    {t("resetPasswordDesc")}
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="resetEmail">{t("email")}</Label>
                    <Input
                      id="resetEmail"
                      type="email"
                      placeholder={t("emailPlaceholder")}
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="bg-background/50"
                      maxLength={255}
                    />
                  </div>
                  <Button type="submit" className="w-full gradient-primary" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t("loading")}
                      </>
                    ) : (
                      <>
                        {t("resetPassword")}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </form>
              </GlassCard>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setShowResetPassword(false);
                  setResetEmail("");
                }}
              >
                {t("backToLogin")}
              </Button>
            </>
          )}
        </motion.div>
      </div>
    );
  }

  // Email confirmation screen
  if (emailSent) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-6"
        >
          <div className="flex justify-end">
            <LanguageSelector />
          </div>

          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/20 mb-4">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              {t("emailConfirmationTitle")}
            </h1>
          </div>

          <GlassCard className="p-6 text-center space-y-4">
            <p className="text-muted-foreground">
              {t("emailConfirmationDesc")}
            </p>
            <p className="text-primary font-medium text-lg">
              {registeredEmail}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("emailConfirmationNote")}
            </p>
            
            {/* Resend email button */}
            <div className="pt-2 border-t border-border/50">
              <p className="text-sm text-muted-foreground mb-3">
                {t("resendEmailDesc")}
              </p>
              <Button
                variant="secondary"
                size="sm"
                disabled={resendingEmail}
                onClick={() => handleResendEmail(registeredEmail, registeredUserId)}
              >
                {resendingEmail ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t("resendingEmail")}
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    {t("resendEmail")}
                  </>
                )}
              </Button>
            </div>
          </GlassCard>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setEmailSent(false);
              setIsLogin(true);
            }}
          >
            {t("backToLogin")}
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-6"
      >
        {/* Language Selector */}
        <div className="flex justify-end">
          <LanguageSelector />
        </div>

        <div className="text-center space-y-2">
          <p className="text-lg text-muted-foreground">Welcome to</p>
          <div className="flex items-center justify-center gap-3">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl gradient-primary">
              <Cpu className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-display font-bold text-gradient">
              iCore
            </h1>
          </div>
          <p className="text-muted-foreground">
            {isLogin ? t("loginTitle") : t("registerTitle")}
          </p>
        </div>

        <GlassCard className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="inviteCode">{t("inviteCode")} *</Label>
                <div className="relative">
                  <Input
                    id="inviteCode"
                    placeholder={t("inviteCodePlaceholder")}
                    value={formData.inviteCode}
                    onChange={(e) => handleInviteCodeChange(e.target.value)}
                    className="bg-background/50 pr-10"
                    maxLength={12}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {checkingCode && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                    {!checkingCode && codeStatus === "valid" && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                    {!checkingCode && codeStatus === "invalid" && <XCircle className="w-4 h-4 text-destructive" />}
                  </div>
                </div>
                {errors.inviteCode && <p className="text-xs text-destructive">{errors.inviteCode}</p>}
                {codeStatus === "valid" && <p className="text-xs text-green-500">{t("inviteCodeValid")}</p>}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">{t("email")} *</Label>
              <Input
                id="email"
                type="email"
                placeholder={t("emailPlaceholder")}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-background/50"
                maxLength={255}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="phone">{t("phone")} *</Label>
                <PhoneInput
                  value={formData.phone}
                  onChange={(phone) => setFormData({ ...formData, phone })}
                  placeholder={t("phonePlaceholder")}
                  maxLength={15}
                />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">{t("password")} *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t("passwordPlaceholder")}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="bg-background/50 pr-10"
                  maxLength={72}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
              {isLogin && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="rememberMe" 
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked === true)}
                    />
                    <label 
                      htmlFor="rememberMe" 
                      className="text-xs text-muted-foreground cursor-pointer"
                    >
                      {t("rememberMe")}
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(true)}
                    className="text-xs text-primary hover:underline"
                  >
                    {t("forgotPassword")}
                  </button>
                </div>
              )}
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t("confirmPassword")} *</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder={t("passwordPlaceholder")}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="bg-background/50 pr-10"
                    maxLength={72}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
              </div>
            )}

            <Button type="submit" className="w-full gradient-primary" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("loading")}
                </>
              ) : (
                <>
                  {isLogin ? t("login") : t("register")}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>

            {/* Show resend email option when login fails due to unverified email */}
            {isLogin && unverifiedEmail && registeredUserId && (
              <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <p className="text-sm text-amber-200 mb-2 text-center">
                  {t("emailNotConfirmed")}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full border-amber-500/50 text-amber-200 hover:bg-amber-500/20"
                  disabled={resendingEmail}
                  onClick={() => handleResendEmail(unverifiedEmail, registeredUserId)}
                >
                  {resendingEmail ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t("resendingEmail")}
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      {t("resendEmail")}
                    </>
                  )}
                </Button>
              </div>
            )}
          </form>
        </GlassCard>

        <p className="text-center text-sm text-muted-foreground">
          {isLogin ? t("noAccount") : t("hasAccount")}{" "}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setErrors({});
              setCodeStatus("idle");
            }}
            className="text-primary hover:underline font-medium"
          >
            {isLogin ? t("register") : t("login")}
          </button>
        </p>
      </motion.div>
    </div>
  );
};

export default Auth;