import { validationResult } from 'express-validator';
import { supabaseAdmin } from '../config/supabase.js';
import { v4 as uuidv4 } from 'uuid';

// REGISTRAR BOLETO
export const registrarBoleto = async (req, res) => {
  try {
    console.log('=== REGISTRAR BOLETO DEBUG ===');
    console.log('req.body:', req.body);
    console.log('req.file:', req.file);
    console.log('req.user:', req.user);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ 
        error: 'Datos inválidos',
        details: errors.array() 
      });
    }

    const { nombre, telefono, tipo_participante, sede, numero_control } = req.body;
    const user = req.user;
    const comprobante = req.file;

    // Parsear numeros_boleto si viene como string
    let numeros_boleto;
    try {
      numeros_boleto = typeof req.body.numeros_boleto === 'string' 
        ? JSON.parse(req.body.numeros_boleto) 
        : req.body.numeros_boleto;
    } catch (error) {
      console.log('Error parsing numeros_boleto:', error);
      return res.status(400).json({ error: 'Formato inválido de números de boleto' });
    }

    console.log('Parsed numeros_boleto:', numeros_boleto);

    if (!comprobante) {
      return res.status(400).json({ error: 'Debes subir un comprobante de pago' });
    }

    // Validar número de control para estudiantes TecNM
    if (tipo_participante === 'Estudiante TecNM' && !numero_control) {
      console.log('ERROR: Falta número de control para estudiante');
      return res.status(400).json({ 
        error: 'Los estudiantes TecNM deben proporcionar su número de control' 
      });
    }

    console.log('✅ Validación número de control pasada');

    // Validar que el usuario no tenga boletos ya
    const { data: boletosExistentes } = await supabaseAdmin
      .from('boletos')
      .select('id')
      .eq('correo', user.email)
      .limit(1);

    console.log('Boletos existentes para', user.email, ':', boletosExistentes);

    if (boletosExistentes && boletosExistentes.length > 0) {
      console.log('ERROR: Usuario ya tiene boletos registrados');
      return res.status(400).json({ 
        error: 'Este correo ya tiene boletos registrados. Si deseas comprar más, contacta al equipo de Siera Code.' 
      });
    }

    console.log('✅ Validación usuario sin boletos pasada');

    // Validar disponibilidad de boletos
    const { data: boletosOcupados } = await supabaseAdmin
      .from('boletos')
      .select('numero_boleto')
      .in('numero_boleto', numeros_boleto);

    console.log('Boletos ocupados:', boletosOcupados);

    if (boletosOcupados && boletosOcupados.length > 0) {
      const ocupados = boletosOcupados.map(b => b.numero_boleto).join(', ');
      console.log('ERROR: Boletos ya ocupados:', ocupados);
      return res.status(400).json({ 
        error: `Los boletos ${ocupados} ya no están disponibles. Intenta con otros números.` 
      });
    }

    console.log('✅ Validación boletos disponibles pasada');

    // Validar reservas
    const { data: reservas } = await supabaseAdmin
      .from('reservas_boletos')
      .select('numero_boleto, user_id')
      .in('numero_boleto', numeros_boleto)
      .gt('expira_at', new Date().toISOString());

    const reservasAjenas = reservas?.filter(r => r.user_id !== user.id) || [];
    if (reservasAjenas.length > 0) {
      const nums = reservasAjenas.map(r => r.numero_boleto).join(', ');
      return res.status(400).json({ 
        error: `Los boletos ${nums} están siendo reservados por otro usuario. Intenta de nuevo en unos momentos.` 
      });
    }

    // Subir comprobante a Supabase Storage
    const fileExt = comprobante.originalname.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `comprobantes/${fileName}`;

    console.log('Intentando subir archivo:', filePath);

    const { error: uploadError } = await supabaseAdmin.storage
      .from('rifa-siera')
      .upload(filePath, comprobante.buffer, {
        contentType: comprobante.mimetype,
        upsert: false
      });

    if (uploadError) {
      console.error('Error al subir comprobante:', uploadError);
      
      // Si el bucket no existe, dar una respuesta más específica
      if (uploadError.message?.includes('Bucket not found')) {
        return res.status(500).json({ 
          error: 'Error de configuración del servidor: Bucket de almacenamiento no encontrado. Contacta al administrador.',
          details: 'El bucket "rifa-siera" no existe en Supabase Storage'
        });
      }
      
      return res.status(500).json({ 
        error: 'Error al subir el comprobante',
        details: uploadError.message 
      });
    }

    // Obtener URL pública
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('rifa-siera')
      .getPublicUrl(filePath);

    // Insertar boletos
    const boletosAInsertar = numeros_boleto.map(numero => ({
      nombre,
      correo: user.email,
      telefono: telefono || null,
      tipo_participante,
      sede: sede || null,
      numero_control: numero_control || null,
      numero_boleto: numero,
      estado: 'pendiente',
      comprobante_url: publicUrl,
      fecha_registro: new Date().toISOString()
    }));

    const { data: boletosInsertados, error: insertError } = await supabaseAdmin
      .from('boletos')
      .insert(boletosAInsertar)
      .select();

    if (insertError) {
      console.error('Error al insertar boletos:', insertError);
      return res.status(500).json({ error: 'Error al registrar boletos' });
    }

    // Liberar reservas
    await supabaseAdmin
      .from('reservas_boletos')
      .delete()
      .eq('user_id', user.id)
      .in('numero_boleto', numeros_boleto);

    res.status(201).json({
      message: 'Boletos registrados exitosamente. Tu compra está en revisión.',
      boletos: boletosInsertados
    });

  } catch (error) {
    console.error('Error en registrarBoleto:', error);
    res.status(500).json({ error: 'Error al registrar boletos' });
  }
};

// OBTENER MIS BOLETOS
export const getMisBoletos = async (req, res) => {
  try {
    const user = req.user;

    const { data: boletos, error } = await supabaseAdmin
      .from('boletos')
      .select('*')
      .eq('correo', user.email)
      .order('fecha_registro', { ascending: false });

    if (error) {
      console.error('Error al obtener boletos:', error);
      return res.status(500).json({ error: 'Error al obtener boletos' });
    }

    res.json({ boletos: boletos || [] });

  } catch (error) {
    console.error('Error en getMisBoletos:', error);
    res.status(500).json({ error: 'Error al obtener boletos' });
  }
};

// OBTENER CATÁLOGO (público)
export const getBoletosCatalogo = async (req, res) => {
  try {
    // Usar la vista que une catálogo con boletos registrados
    const { data: catalogo, error } = await supabaseAdmin
      .from('vw_boletos_estado')
      .select('numero_boleto, estado')
      .order('numero_boleto');

    if (error) {
      console.error('Error al obtener catálogo:', error);
      return res.status(500).json({ error: 'Error al obtener catálogo' });
    }

    res.json({ catalogo: catalogo || [] });

  } catch (error) {
    console.error('Error en getBoletosCatalogo:', error);
    res.status(500).json({ error: 'Error al obtener catálogo' });
  }
};

// OBTENER TRANSPARENCIA (público)
export const getTransparencia = async (req, res) => {
  try {
    const { data: boletos, error } = await supabaseAdmin
      .from('boletos')
      .select('numero_boleto, nombre, estado, fecha_registro')
      .eq('estado', 'confirmado')
      .order('numero_boleto');

    if (error) {
      console.error('Error al obtener transparencia:', error);
      return res.status(500).json({ error: 'Error al obtener transparencia' });
    }

    res.json({ boletos: boletos || [] });

  } catch (error) {
    console.error('Error en getTransparencia:', error);
    res.status(500).json({ error: 'Error al obtener transparencia' });
  }
};
