package com.helios.auctix.mappers.impl;

import com.helios.auctix.domain.user.UserSocialMediaLink;
import com.helios.auctix.dtos.UserSocialMediaLinkDTO;
import com.helios.auctix.mappers.Mapper;
import org.springframework.stereotype.Component;

@Component
public class UserSocialMediaLinkMapperImpl implements Mapper<UserSocialMediaLink, UserSocialMediaLinkDTO> {
    public UserSocialMediaLinkDTO mapTo(UserSocialMediaLink link) {
        if (link == null) return null;
        return new UserSocialMediaLinkDTO(link.getId(), link.getLink());
    }

    public UserSocialMediaLink mapFrom(UserSocialMediaLinkDTO dto) {
        if (dto == null) return null;
        return UserSocialMediaLink.builder()
                .id(dto.getId())
                .link(dto.getLink())
                .build();
    }

    public UserSocialMediaLink mapFromString(String link) {
        if (link == null) return null;
        UserSocialMediaLink rlink = UserSocialMediaLink.builder()
                .link(link)
                .build();
        return rlink;
    }

    public UserSocialMediaLinkDTO createFrom(String url) {
        if (url == null) return null;
        UserSocialMediaLinkDTO dto = UserSocialMediaLinkDTO.builder()
                .link(url)
                .build();
        return dto;
    }
}
