export interface ProfessionalRaw {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  profilePicture?: string;
  role?: string;
  price?: number;
  rating?: number;
  numReviews?: number;
  businessDetails?: {
    specialization?: string;
    experience?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface ProfessionalMapped {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  profilePicture: string | null;
  role: string;
  price: number;
  rating: number;
  numReviews: number;
  specialization: string;
  experience: string;
}

export class ProfessionalMapper {
  static toDomain(raw: ProfessionalRaw): ProfessionalMapped {
    return {
      id: raw._id || "",
      name: raw.name || "Unknown Professional",
      email: raw.email || null,
      phone: raw.phone || null,
      profilePicture: raw.profilePicture || null,
      role: (raw.role || "professional").toLowerCase(),
      price: raw.price || 0,
      rating: raw.rating || 0,
      numReviews: raw.numReviews || 0,
      specialization: raw.businessDetails?.specialization || "General",
      experience: raw.businessDetails?.experience || "Beginner",
    };
  }

  static toDomainList(rawList: ProfessionalRaw[]): ProfessionalMapped[] {
    if (!Array.isArray(rawList)) return [];
    return rawList.map(ProfessionalMapper.toDomain);
  }
}
